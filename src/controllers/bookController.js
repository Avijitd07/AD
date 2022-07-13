const bookModel = require("../models/bookModel")
const userModel = require("../models/userModel")
const reviewModel = require("../models/reviewModel")
const ObjectId = require('mongoose').Types.ObjectId
const moment = require('moment')


// const isbnReGeX = /^[\d*\-]{10}|[\d*\-]{13}$/;
const isbnReGeX = /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/;



const isValid = function(x) {
    if (typeof x === "undefined" || x === null) return false;
    if (typeof x === "string" && x.trim().length === 0) return false;

    return true;
};
const isValidBody = function(x) {
    return Object.keys(x).length > 0;
};


const createBook = async function(req, res) {
    try {
        //authorization
        let TokenFromUser = req.userId
        if (!TokenFromUser) return res.status(400).send({ status: false, message: "is not a valid token id" })

        let body = req.body

        if (!isValidBody(body)) {
            return res.status(400).send({ status: false, message: "Invalid Request Parameter, Please Provide Another Details" });
        }
        let { title, excerpt, category, subcategory, ISBN, userId, releasedAt } = body

        ISBN = ISBN.replace(/-/g, "")


        if (!isValid(title)) {
            return res.status(400).send({ status: false, message: "Title is Required" })
        }
        if (!isValid(excerpt)) {
            return res.status(400).send({ status: false, message: "Excerpt is Required" })
        }
        if (!isValid(category)) {
            return res.status(400).send({ status: false, message: "category is Required" })
        }
        if (!isValid(userId)) {
            return res.status(400).send({ status: false, message: "userId is Required" })
        }
        if (!isValid(ISBN)) {
            return res.status(400).send({ status: false, message: "ISBN is Required" })
        }

        if (!isValid(releasedAt)) {
            return res.status(400).send({ status: false, message: "Please provide released date" });
        }

        //Date format("YYYY-MM-DD") validation
        const dateRgx =
            /^(00|01|02|03|04|05|06|07|08|09|10|11|12|13|14|15|16|17|18|19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/.test(
                body.releasedAt
            );
        // const dateRgx =
        //     /^(00|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/.test(
        //         body.releasedAt
        //     );
        if (!dateRgx) {
            return res.status(400).send({
                status: false,
                message: "Please provide valid date in this formate YYYY-MM-DD",
            });
        }

        //validation of ISBN
        if (!isbnReGeX.test(ISBN)) return res.status(400).send({ status: false, message: "Not a valid ISBN. It can be 10 or 13 numeric characters." })



        // checking vaild userId
        if (!ObjectId.isValid(userId)) {
            return res.status(400).send({ status: false, message: "Bad Request. UserId invalid" })
        }
        let getUserData = await userModel.findById(userId)
        if (!getUserData) return res.status(404).send({ status: false, message: "User not found" })

        if (getUserData._id.toString() !== TokenFromUser) return res.status(403).send({ status: false, message: "Unauthorized access ! user doesn't match" })

        
        // ISBN = ISBN.replace(/-/g, "")
        let getBookDetails = await bookModel.findOne({ $or: [{ title: title }, { ISBN: ISBN }] })

        if (getBookDetails) {
            if (getBookDetails.title == title) {
                return res.status(400).send({ status: false, message: `${title} title already registered ` })
            } else {
                return res.status(400).send({ status: false, message: `${ISBN} ISBN already registered` })
            }
        }

        const validBlogData = { title, excerpt, category, ISBN, userId, releasedAt }

        if (subcategory) {
            if (Array.isArray(subcategory)) {
                validBlogData['subcategory'] = [...subcategory]
            }
        }

        if (validBlogData.ISBN) {
            validBlogData.ISBN = validBlogData.ISBN.replace(/-/g, "")
        }


        let bookData = await bookModel.create(validBlogData)
        return res.status(201).send({ status: true, data: bookData })

    } catch (error) {

        return res.status(500).send({ message: "Server side Errors. Please try again later", error: error.message })

    }
}


////////////----> GET /books
const bookDetails = async function(req, res) {
        try {
            let query = req.query;
            let { userId, category, subcategory } = query;

            if ("userId" in query && !ObjectId.isValid(userId)) {
                return res.status(400).send({ status: false, message: "Bad Request. UserId invalid" })
            }

            let filter = { isDeleted: false };

            if (subcategory) filter.subcategory = { $all: subcategory.split(",") }
            if (category) filter.category = category;
            if (userId) filter.userId = userId;


            if (query.userId) {
                const validate = await userModel.findById(query.userId);
                if (!validate) return res.status(404).send({ status: false, message: "UserId is not valid" });
            }

            const data = await bookModel.find(filter).select({ ISBN: 0,isDeleted:0, subcategory: 0, __v: 0 }).sort({ title: 1 })
            if (data.length == 0) return res.status(404).send({ status: false, message: "No book is found" })
            return res.status(200).send({
                status: true,
                message: "Book List",
                data: data

            })
        } catch (err) {

            return res.status(500).send({ status: false, Error: err.message })
        }
}




///////////////////--->GET /books/:bookId
const getBookDetails = async function(req, res) {
        try {
            let _id = req.params.bookId
            if (!ObjectId.isValid(_id)) return res.status(400).send({ status: false, message: "Not a valid Book ID" })


            let check = await bookModel.findOne({ $and: [{ _id }, { isDeleted: false }] }).select({ __v: 0 }).lean()
            if (!check) return res.status(404).send({ status: false, message: "Please enter valid id" })

            let review = await reviewModel.find({ $and: [{ bookId: _id }, { isDeleted: false }] }).select({ __v: 0, isDeleted: 0, createdAt: 0, updatedAt: 0 })
            check.reviewsData = review
            
            res.status(200).send({ status: false, message: "Book List", data: check })
        } catch (err) {
            return res.status(500).send({ status: false, message: err.message })
        }
}



///////-->PUT /books/:bookId////
const updateBook = async function(req, res) {

    try {
        let bookId = req.params.bookId
        //authorization
        let TokenFromUser = req.userId

        // checking for valid bookId
        if (!ObjectId.isValid(bookId)) return res.status(400).send({ status: false, message: "Not a valid Book ID" })

        if (!TokenFromUser) return res.status(400).send({ status: false, message: "is not a valid token id" })
        let findBookId = await bookModel.findById({ _id: bookId })
        if (!findBookId) return res.status(400).send({ status: false, message: "invalid id" })
        if (findBookId.userId.toString() !== TokenFromUser) return res.status(401).send({ status: false, message: "Unauthorized access ! user doesn't match" })



        let reqBody = req.body

        let { title, excerpt, releasedAt, ISBN } = reqBody;




        //checking body is empty or not
        if (!isValidBody(reqBody)) {
            return res.status(400).send({ status: false, message: "Please enter a field to update" });
        }



        //checking that title key is having value or not
        if ("title" in reqBody && !isValid(title)) {
            return res.status(400).send({ status: false, message: "Title is Required, to update Title" })
        }
        //checking for unique book title
        if (title) {
            uniqueBookTitle = await bookModel.findOne({ title: title }).select({ title: 1 })
            if (uniqueBookTitle) return res.status(400).send({ status: false, message: "You can not update with this book title as, this title is already present" })
        }

        //checking that ISBN key is having value or not
        if ("ISBN" in reqBody && !isValid(ISBN)) {
            return res.status(400).send({ status: false, message: "ISBN is Required, to update ISBN" })
        }
        //checking for unique book ISBN
        if (ISBN) {
            ISBN = ISBN.replace(/-/g, "")
            let uniqueBookisbn = await bookModel.findOne({ ISBN: ISBN }).select({ ISBN: 1 })
            if (uniqueBookisbn) return res.status(400).send({ status: false, message: "You can not update with this book ISBN as, this book ISBN is already present" })
        }

        if("ISBN" in req.body) 
        ISBN = ISBN.replace(/-/g, "")
        //validation of ISBN
        if ("ISBN" in reqBody && !isbnReGeX.test(ISBN)) return res.status(400).send({ status: false, message: "Not a valid ISBN" })




        //checking that releasedAt key is having value or not
        if ("releasedAt" in reqBody && !isValid(releasedAt)) {
            return res.status(400).send({ status: false, message: "Released is Required, to update releasedAt" })
        }



        //checking that excerpt key is having value or not
        if ("excerpt" in reqBody && !isValid(excerpt)) {
            return res.status(400).send({ status: false, message: "Excerpt is Required, to update excerpt" })
        }


        let updatedBookData = await bookModel.findOneAndUpdate({ _id: bookId, isDeleted: false }, {
            $set: {
                title,
                excerpt,
                releasedAt,
                ISBN
            }
        }, { new: true })

        if (!updatedBookData) return res.status(404).send({ status: false, message: "Data not found" })

        return res.status(200).send({ status: true, message: "success", data: updatedBookData })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}



/////////------->  DELETE /books/:bookId
const deleteBookById = async function(req, res) {
    try {
        let enteredBookId = req.params.bookId

        //authorization
        let TokenFromUser = req.userId

        if (!ObjectId.isValid(enteredBookId)) return res.status(400).send({ status: false, message: "Bad Request. BookId invalid" })


        if (!TokenFromUser) return res.status(400).send({ status: false, message: "is not a valid token id" })
        let findBookId = await bookModel.findById({ _id: enteredBookId })
        if (!findBookId) return res.status(400).send({ status: false, message: "invalid id" })
        if (findBookId.userId.toString() !== TokenFromUser) return res.status(401).send({ status: false, message: "Unauthorized access ! user doesn't match" })


        let deleteDate = moment().format('YYYY-MM-DD h:mm:ss')

        const searchBook = await bookModel.findOneAndUpdate({ _id: enteredBookId, isDeleted: false }, { isDeleted: true, deletedAt: deleteDate })

        if (!searchBook) return res.status(404).send({ status: false, message: "Resource not found. BookId does not exist" })


        return res.status(200).send({ status: true, message: "Book successfully deleted" })
    } catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}


module.exports = { createBook, bookDetails, updateBook, deleteBookById, getBookDetails }