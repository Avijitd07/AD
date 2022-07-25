const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const { uploadFile } = require('../middleWare/fileUpload');


const createUser = async function (req, res) {
    try {
        let files = req.files
        if (files && files.length > 0) {
            //upload to s3 and get the uploaded link
            // res.send the link back to frontend/postman
            var uploadedFileURL = await uploadFile(files[0])
            //res.status(201).send({msg: "file uploaded succesfully", data: uploadedFileURL})
           
        }
        else {
            res.status(400).send({ msg: "No file found" })
        }
        let body = req.body;
        let { fname, lname, email, phone, address, password } = body;
        

        let profileImage = uploadedFileURL;
        let validUserData = {fname, lname, email, profileImage, phone, address, password}

        validUserData.profileImage = profileImage

        let userdata = await userModel.create(validUserData);
        return res.status(201).send({ status: true, data: userdata });

    } catch (error) {

        return res.status(500).send({ status: false, message: error.message });

    }
}
const loginUser = async function(req,res){
    try{
    let email = req.body.email
    let password = req.body.password

    let findUser = await userModel.findOne({email:email})
    if(!findUser) return res.status(404).send({status:false,msg:'invalid emailId'})
    let hashPass = findUser.password
    let userId = findUser._id.toString()
    let compare = await bcrypt.compare(password,hashPass)
    if(!compare) {
        return res.status(400).send({status:false,msg:'password is incorrect'})
    }else{
        let token = jwt.sign({
            id: userId,
            batch: "radon",
            organization: "functionUp"
        }, "GroupNo-61", { expiresIn: '1h' })
        return res.status(200).send({status:true,UserId:userId,token:token})

    }
    }catch(err){
        return res.status(500).send(err.message)
    }
}
/******
split
1th index
 * ********* */
//req.headers['authorization']


module.exports = { createUser,loginUser };