const internModel = require("../models/internModels");
const collegeModel = require("../models/collegeModels");


const validateEmail = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/;
let validMobile = /^[6-9]\d{9}$/;
let nameRegex = /^[.a-zA-Z\s,-]+$/;



const isValid = function (x) {
    if (typeof x === "undefined" || x === null) return false;
    if (typeof x === "string" && x.trim().length === 0) return false;
    return true;
};

const isValidBody = function (x) {
    return Object.keys(x).length > 0;
};

//-------------------------POST API CREATE INTERN DETAILS---------------------------------------
const createIntern = async function (req, res) {
    try {
        let userRequest = req.body;

        if (!isValidBody(userRequest)) {
            return res.status(400).send({ status: false, message: "Invalid Request Parameter, Please Provide Another Details", });
        }

        let { name, email, mobile, collegeName } = userRequest

        if (!isValid(name)) return res.status(400).send({ status: false, message: "name is required" });
        if (!isValid(email)) return res.status(400).send({ status: false, message: "email is required" });
        if (!isValid(collegeName)) return res.status(400).send({ status: false, message: "collegeName is required" });
        if (!isValid(mobile)) return res.status(400).send({ status: false, message: "mobile is required" });



        //Validation of email, phone number and name
        if (!validateEmail.test(email)) return res.status(400).send({ status: false, message: "email should be in right format" });

        if (!validMobile.test(mobile)) return res.status(400).send({ status: false, message: "mobile number should contain only numeric numbers and must contain 10 numbers" });

        if (!nameRegex.test(name)) return res.status(400).send({ status: false, message: "don't enter numeric value" })

        //Checking duplicate email and phone number
        let uniqueName = await internModel.findOne({ $or: [{ email: email }, { mobile: mobile }] })
        if (uniqueName) {
            if (uniqueName.email == email) return res.status(400).send({ stastus: false, message: "email is already exist" })
            if (uniqueName.mobile == mobile) return res.status(400).send({ stastus: false, message: "mobile is already exist" })
        }



        let collegeData = await collegeModel.findOne({ fullName: collegeName }).select({ _id: 1 })

        if (!collegeData) return res.status(404).send({ status: false, message: "College not found" });

        let collegeId = collegeData._id

        let data = { name, email, mobile, collegeId }

        let internData = await internModel.create(data);

        let requiredInternData = { isDeleted: internData.isDeleted, name: internData.name, email: internData.email, mobile: internData.mobile, collegeId: internData.collegeId }

        res.status(201).send({ status: true, data: requiredInternData });

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

module.exports.createIntern = createIntern;