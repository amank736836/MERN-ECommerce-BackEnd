import { NextFunction, Request, Response } from "express";
import { Date } from "mongoose";

export interface NewUserRequestBody {
  name: string;
  email: string;
  photo: string;
  gender: string;
  _id: string;
  dob: Date;
}
export interface NewProductRequestBody {
  name: string;
  price: number;
  category: string;
  stock: number;
  description: string;
}

export type shippingInfoType = {
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: number;
};

export type orderItemType = {
  name: string;
  photos: [{ public_id: string; url: string }];
  price: number;
  quantity: number;
  productId: string;
};
export interface NewOrderRequestBody {
  shippingInfo: shippingInfoType;
  user: string;
  subtotal: number;
  tax: number;
  shippingCharges: number;
  discount: number;
  total: number;
  orderItems: orderItemType[];
}

export type ControllerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;

export type SearchRequestQuery = {
  search?: string;
  price?: string;
  category?: string;
  sort?: string;
  page?: string;
};

export interface BaseQuery {
  name?: {
    $regex: string;
    $options: string;
  };
  price?: {
    $lte: number;
  };
  category?: string;
}

export type InvalidateCacheProps = {
  admin?: boolean;
  user?: boolean;
  order?: boolean;
  product?: boolean;
  coupon?: boolean;
  review?: boolean;
  userId?: string;
  orderId?: string;
  productId?: string | string[];
  couponId?: string;
};
