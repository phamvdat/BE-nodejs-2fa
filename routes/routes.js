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
			res.status(400).json({ message: "Email not found" })
			return
		}
		const passwordValid = await bcrypt.compare(req.body.password, user.password)
		if (!passwordValid) {
			res.status(400).json({ message: "Email or password incorrect" })
			return
		}
		res.status(200).json(user)
	}
	catch (error) {
		res.status(500).json({ message: error.message })
	}
})

//Update two factor
router.patch('/two-factor-mode/:id', async (req, res) => {
	try {
		const id = req.params.id;
		const result = await Model.findByIdAndUpdate(
			id, req.body
		)
		res.send(result)
	}
	catch (error) {
		res.status(500).json({ message: error.message })
	}
})
// setup two factor authenticator
router.post("/setup-2fa/:id", async (req, res) => {
	const userId = req.params.id;
	// Create a secret for the user
	const secret = speakeasy.generateSecret({ length: 20 });
	// Generate a QR code for the user to scan
	const qrCode = await qrcode.toDataURL(secret.otpauth_url);

	// Store the secret in the database for this user
	const user = await Model.findByIdAndUpdate(userId, { secret: secret.base32 });
	res.send({ qrCode });
});









// //Get all Method
// router.get('/getAll', async (req, res) => {
// 	try {
// 		const data = await Model.find();
// 		res.json(data)
// 	}
// 	catch (error) {
// 		res.status(500).json({ message: error.message })
// 	}
// })


// //Delete by ID Method
// router.delete('/delete/:id', async (req, res) => {
// 	try {
// 		const id = req.params.id;
// 		const data = await Model.findByIdAndDelete(id)
// 		res.send(`Document with ${data.name} has been deleted..`)
// 	}
// 	catch (error) {
// 		res.status(400).json({ message: error.message })
// 	}
// })

module.exports = router;