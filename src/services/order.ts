/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as express from 'express';
import orderModel from '../models/order';
import RequestWithOrder from '../interfaces/requestWithOrder';
import HttpException from '../exceptions/HttpException';
import NotFoundException from '../exceptions/NotFoundException';
import WrongCredentialsException from '../exceptions/WrongCredentialsException';
import CreateOrderDto from '../dtos/order';
import productModel from '../models/product';
import QuantityOrderedGreaterThanInStockException from '../exceptions/QuantityOrderedGreaterThanInStockException';
import { v4 as uuidv4 } from 'uuid';
import userModel from '../models/user';

const getAllOrders = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
  try {
    const orders = await orderModel.find();
    return response.status(200).json({
      Orders: orders,
    });
  } catch (error) {
    return next(new HttpException(500, 'Internal Server Error'));
  }
};

const getOrderById = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
  try {
    const _id = request.params.id;
    const order = await orderModel.findById({ _id });
    if (!order) {
      return next(new NotFoundException());
    }
    return response.status(200).json({
      Order: order,
    });
  } catch (error) {
    return next(new WrongCredentialsException());
  }
};

const createAnOrder = async (request: RequestWithOrder, response: express.Response, next: express.NextFunction) => {
  const orderData: CreateOrderDto = request.body;
  const productId = orderData.product;
  const time = new Date();
  const newUuid = uuidv4();
  try {
    const productThatWasOrdered = await productModel.findById({ _id: productId });
    const productJSON = productThatWasOrdered.toJSON();
    productJSON.inStock = productJSON.inStock - orderData.quantity;
    if (productJSON.inStock < 0) {
      return next(new QuantityOrderedGreaterThanInStockException());
    }
    await productModel.findByIdAndUpdate({ _id: productId }, productJSON);
    const order = await orderModel.create({
      ...orderData,
      date: time,
      uuid: newUuid,
    });

    response.status(200).json({
      Order: order,
    });
  } catch (error) {
    return next(new HttpException(500, 'Internal Server Error'));
  }
};
const deleteAnOrder = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
  const _id = request.params.id;
  try {
    const deleteResult = await orderModel.findByIdAndDelete({ _id });
    if (!deleteResult) {
      return next(new WrongCredentialsException());
    }
    return response.sendStatus(200);
  } catch (error) {
    return next(new WrongCredentialsException());
  }
};

const getAllOrdersOfCustomer = async (
  request: express.Request,
  response: express.Response,
  next: express.NextFunction,
) => {
  const _id = request.params.id;
  try {
    const user = await userModel.findById({ _id });
    const ordersOfCustomer = await orderModel.find({
      customer: user.id,
    });
    return response.status(200).json({
      Orders: ordersOfCustomer,
    });
  } catch (error) {
    return next(new WrongCredentialsException());
  }
};

export { getAllOrders, getOrderById, createAnOrder, deleteAnOrder, getAllOrdersOfCustomer };
