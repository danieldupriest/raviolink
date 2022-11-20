import dotenv from "dotenv"
dotenv.config()
import Joi from "joi"

export const uidSchema = Joi.string().alphanum().min(7).max(7).required()

export const ipSchema = Joi.string()
    .ip({ version: ["ipv4"] })
    .required()

export const linkPostSchema = Joi.object({
    type: Joi.string().valid("link", "text", "file").required(),
    content: Joi.string().when('type', {
      is: 'file',
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
    expires: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
    deleteOnView: Joi.boolean().default(false),
    raw: Joi.boolean().default(false),
    textType: Joi.string().default("plain"),
})

export const linkServeSchema = Joi.object({
    content: Joi.string().required(),
    type: Joi.string().valid("link", "text", "file").required(),
    expiresOn: Joi.string().allow(null).required(),
    deleteOnView: Joi.boolean().required(),
    raw: Joi.boolean().required(),
    id: Joi.number().required(),
    createdOn: Joi.date().required(),
    uid: uidSchema,
    tempFilename: Joi.string().valid("").required(),
    mimeType: Joi.string().allow("").required(),
    deleted: Joi.boolean().required(),
    textType: Joi.string().required(),
    ip: Joi.string()
        .ip({ version: ["ipv4"] })
        .required(),
    viewsLeft: Joi.number().min(0).required(),
    views: Joi.number().min(0).required(),
})

export const sizeSchema = Joi.number()
    .min(2)
    .max(parseInt(process.env.MAXIMUM_IMAGE_RESIZE))
    .optional()
