const bookModel = require("../models/bookModel")
const reviewModel = require("../models/reviewModel")
const ObjectId = require('mongoose').Types.ObjectId


const ratingRegex = /^([1-5]|1[5])$/


const isValid = function (x) {
    if (typeof x === "undefined" || x === null) return false;
    if (typeof x === "string" && x.trim().length === 0) return false;

    return true;
};
const isValidBody = function (x) {
    return Object.keys(x).length > 0;
};



const createReview = async function (req, res) {
    try {
        let bookId = req.params.bookId

        if (!ObjectId.isValid(bookId)) {
            return res.status(400).send({ status: false, message: "Bad Request. BookId invalid" })
        }

        let data = req.body;

        if (!isValidBody(data)) {
            return res.status(400).send({ status: false, message: "Invalid Request Parameter, Please Provide Another Details" });
        }

        let { rating } = data


        if (!isValid(rating)) {
            return res.status(400).send({ status: false, message: "Rating is Required" })
        }

        if (!ratingRegex.test(rating)) return res.status(400).send({ status: false, message: "Not a valid rating, it should be within 1 - 5" })


        let findBookId = await bookModel.findById(bookId)
        if (!findBookId) return res.status(404).send({ status: false, message: "No data found with this BookId" })

        //assign bookId from path
        data.bookId = bookId;
        //create review
        const createReview = await reviewModel.create(data);


        const updatedBook = await bookModel.findOneAndUpdate({ _id: bookId, isDeleted: false }, { $inc: { reviews: 1 } }, { new: true }).lean()
        if (!updatedBook) return res.status(404).send({ status: false, message: "There is no book with that id" })


        //const getReview = await reviewModel.find({ bookId: bookId }).select({ createdAt: 0, updatedAt: 0, isDeleted: 0, __v: 0 })

        updatedBook.reviewsData = {
            _id: createReview._id,
            bookId: createReview.bookId,
            reviewedBy: createReview.reviewedBy,
            reviewedAt: createReview.reviewedAt,
            rating: createReview.rating,
            review: createReview.review
        }


        res.status(201).send({ status: true, message: "success", data: updatedBook })

    } catch (error) {

        return res.status(500).send({ status: false, msg: error.message })
    }
}


const updateReview = async function (req, res) {
    try {
        let bookId = req.params.bookId
        let reviewId = req.params.reviewId
        let data = req.body
        let {reviewedBy, review, rating} = data

        if (!isValidBody(data)) {
            return res.status(400).send({ status: false, message: "Invalid Request Parameter, Please Provide Another Details" });
        }

        if (!ObjectId.isValid(bookId)) {
            return res.status(400).send({ status: false, message: "Bad Request. BookId invalid" })
        }
        if (!ObjectId.isValid(reviewId)) {
            return res.status(400).send({ status: false, message: "Bad Request. Review invalid" })
        }


        if ("reviewedBy" in data && !isValid(reviewedBy)) {
            return res.status(400).send({ status: false, message: "reviewer name cannot be blank" })
        }
        if ("rating" in data && !isValid(rating)) {
            return res.status(400).send({ status: false, message: "rating cannot be blank" })
        }
        if ("review" in data && !isValid(review)) {
            return res.status(400).send({ status: false, message: "review cannot be blank" })
        }




        let bookData = await bookModel.findOne({ _id: bookId, isDeleted: false }).lean()
        if (!bookData) return res.status(404).send({ status: false, message: "No data found" })


        let val = { reviewedBy, review, rating }
        let updateReview = await reviewModel.findOneAndUpdate({ _id: reviewId, isDeleted: false }, { $set: val }, { new: true })
        if (!updateReview) return res.status(404).send({ status: false, message: "No data found" })


        // let result = bookData.toObject()
        // result.reviews = updateReview

        bookData.reviewsData = {
            _id: updateReview._id,
            bookId: updateReview.bookId,
            reviewedBy: updateReview.reviewedBy,
            reviewedAt: updateReview.reviewedAt,
            rating: updateReview.rating,
            review: updateReview.review
        }

        return res.status(200).send({ status: true, message: "Review updated successfully ", data: bookData })

    } catch (error) {

        return res.status(500).send({ status: false, message: error.message })

    }
}


/////// DELETE /books/:bookId/review/:reviewId

const deletReview = async function (req, res) {

    try {
        let bookId = req.params.bookId
        let reviewId = req.params.reviewId


        if (!ObjectId.isValid(bookId)) {
            return res.status(400).send({ status: false, message: "Bad Request. BookId invalid" })
        }
        if (!ObjectId.isValid(reviewId)) {
            return res.status(400).send({ status: false, message: "Bad Request. ReviewId invalid" })
        }



        let checkReviewId = await reviewModel.findOneAndUpdate(
            { _id: reviewId, isDeleted: false },
            { $set: { isDeleted: true } },
            { new: true })

        if (!checkReviewId) return res.status(404).send({ status: false, message: "Data not found with this reviewId" })

        let checkbookId = await bookModel.findOneAndUpdate(
            { _id: bookId, isDeleted: false },
            { $inc: { reviews: -1 } },
            { new: true })

        if (!checkbookId) return res.status(404).send({ status: false, message: "Data not found with this bookId" })


        return res.status(200).send({ status: true, message: "Success" })

    } catch (error) {

        return res.status(500).send({ status: false, message: "Server error" })

    }

}



module.exports = { createReview, updateReview, deletReview }