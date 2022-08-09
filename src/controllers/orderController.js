const cartModel = require('../models/cartModel')
const orderModel = require('../models/orderModel')
const productModel = require('../models/productModel')
const ObjectId = require('mongoose').Types.ObjectId

const isValid = function (val) {
    if (typeof val === "undefined" || val === null) return false;
    if (typeof val === "string" && val.trim().length === 0) return false;

    return true;
};

const isValidBody = function (val) {
    return Object.keys(val).length > 0;
};

const isValidStatus = function (val) {
    return ["pending", "completed", "canceled"].indexOf(val) !== -1;
};

const orderCreate = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body
        let { cartId, cancellable, ...rest } = data
        if (!isValidBody(data)) return res.status(400).send({ status: false, message: "body can't be empty" })
        if (Object.keys(rest).length > 0) return res.status(400).send({ status: false, message: "please put valid keys" })
        if (cancellable || cancellable == '') {
            if (!isValid(cancellable)) return res.status(400).send({ status: false, message: 'cancellable can not be empty' })
            //Boolean(cancellable)
            if (cancellable !== "true" && cancellable !== "false") return res.status(400).send({ status: false, message: 'please put a true or false value' })
            cancellable = cancellable
        }

        if (!ObjectId.isValid(cartId)) return res.status(400).send({ status: false, message: 'please put a valid cartId' })
        let cartData = await cartModel.findOne({ userId: userId })
        //console.log(cartData._id)
        if (!cartData) return res.status(404).send({ status: false, message: 'cart not found for the user' })
        if (cartId !== cartData._id.toString()) return res.status(400).send({ status: false, message: 'this cart is not for this login userr' })
        let items = cartData.items
        let totalPrice = cartData.totalPrice
        let totalItems = cartData.totalItems
        let sum = 0
        for (let i = 0; i < items.length; i++) {
            sum += cartData.items[i].quantity
        }

        let obj = {
            userId: userId,
            items: items,
            totalPrice: totalPrice,
            totalItems: totalItems,
            totalQuantity: sum,
            cancellable: cancellable
        }
        if(cartData.items.length == 0) return res.status(400).send({status:false,message:"invalid request"})
        let order = await orderModel.create(obj)
        await cartModel.findByIdAndUpdate(cartId,{$set:{items:[],totalItems:0,totalPrice:0}})
        return res.status(200).send({ status: false, message: 'Success', data: order })

    } catch (err) {
        console.log(err)
        return res.status(500).send(err.message)
    }
}

const updateOrder = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body
        let { orderId, status, ...rest } = data

        if (!isValidBody(data)) return res.status(400).send({ status: false, message: "body can't be empty" })
        if (Object.keys(rest).length > 0) return res.status(400).send({ status: false, message: "please put valid keys" })
        if (!isValidStatus(status)) return res.status(400).send({ status: false, message: "please put valid status" })

        if (!ObjectId.isValid(orderId)) return res.status(400).send({ status: false, message: 'please put a valid orderId' })

        let orderData = await orderModel.findOne({ _id: orderId, userId: userId })

        if (!orderData) return res.status(404).send({ status: false, message: 'order not found for the user' })
        if (userId !== orderData.userId.toString()) return res.status(404).send({ status: false, message: 'this orderId is not for this user' })

        if (status == "canceled") {
            if (orderData.cancellable == false) return res.status(400).send({ status: false, message: 'this order is not available for cancelation' })
        }

        if(orderData.status==="canceled"){
            return res.status(400).send({status:false,message:'the order is canceled, you can not change its status'})
        }
        if(orderData.status==="completed"){
            return res.status(400).send({status:false,message:'the order is completed, you can not change its status'})
        }

        let updateOrder = await orderModel.findOneAndUpdate({ _id: orderId, userId: userId }, { $set: { status: status } }, { new: true })
        return res.status(200).send({ status: true, message: 'Success', data: updateOrder })
    } catch (err) {
        console.log(err)
        return res.status(500).send(err.message)
    }
}

module.exports = { orderCreate, updateOrder }