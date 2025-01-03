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
  orderItems: orderItemType[];
  shippingInfo: shippingInfoType;
  coupon: string;
  user: string;
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
  review?: boolean;
  user?: boolean;
  userId?: string;
  order?: boolean;
  orderId?: string;
  product?: boolean;
  productId?: string | string[];
  coupon?: boolean;
  couponId?: string;
};

export type CartItem = {
  productId: string;
  name: string;
  photos: {
    url: string;
    public_id: string;
  }[];
  price: number;
  quantity: number;
  stock: number;
};
