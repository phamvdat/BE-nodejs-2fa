const express = require('express');
const Model = require('../models/model');
const router = express.Router();
const bcrypt = require('bcrypt');
const qrcode = require("qrcode");
const speakeasy = require("speakeasy");

//register Method
router.post('/register', async (req, res) => {
	const hashPassword = await bcrypt.hash(req.body.password, 10);
	const data = new Model({
		fullname: req.body.fullname,
		email: req.body.email,
		password: hashPassword,
		twoFactorEnable: false,
	})

	try {
		const dataToSave = await data.save();
		res.status(200).json(dataToSave)
	}
	catch (error) {
		res.status(400).json({ message: error.message })
	}
})


//login Method
router.post('/login', async (req, res) => {
	try {
		const user = await Model.findOne({ email: req.body.email });
		if (!user) {
			return res.status(400).json({ message: "Email not found" })
		}
		const passwordValid = await bcrypt.compare(req.body.password, user.password)
		if (!passwordValid) {
			return res.status(400).json({ message: "Email or password incorrect" })
		}
		res.status(200).json(user)
	}
	catch (error) {
		res.status(500).json({ message: error.message })
	}
})

//Update two factor: enable | disable
router.post('/two-factor-mode/:id', async (req, res) => {
	try {
		const id = req.params.id;
		const twoFactorEnable = req.body.twoFactorEnable
		if (twoFactorEnable) {
			const secret = await speakeasy.generateSecret();
			const qrCode = await qrcode.toDataURL(secret.otpauth_url);
			await Model.findByIdAndUpdate(
				id, {
				twoFactorEnable: twoFactorEnable,
				secret: secret
			},
			)
			console.log(qrCode);
			res.send({ qrCode })
		}
		else {
			await Model.findByIdAndUpdate(
				id, { twoFactorEnable: twoFactorEnable }
			)
			res.json('disable success')
		}
	}
	catch (error) {
		res.status(500).json({ message: error.message })
	}
})

// verify
router.post("/verify", async (req, res) => {
	const { userId, token } = req.body;
	try {
		const user = await Model.findById(userId);
		const { base32: secret } = user.temp_secret;
		const verified = speakeasy.totp.verify({
			secret,
			encoding: 'base32',
			token
		});
		if (verified) {
			return res.status(401).send({
				success: false,
				message: 'TOTP code is incorrect'
			});
		}
		res.send({
			success: true,
			message: 'Login successful'
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Error retrieving user' })
	};
})

module.exports = router;