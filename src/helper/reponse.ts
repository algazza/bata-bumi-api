import type { Response } from "express";

export function successResponse(res: Response, data: any, message = "Success") {
	return res.status(200).json({
		success: true,
		message,
		data,
	});
}

export function errorResponse(res: Response, status: number, message: string) {
	return res.status(status).json({
		success: false,
		message,
	});
}


export function validationErrorResponse(res: Response, errors: any) {
    const formatted = errors.format ? errors.format() : {};
    const errorObj: Record<string, string[]> = {};

    for (const key in formatted) {
        if (formatted[key]?._errors && formatted[key]._errors.length > 0) {
            errorObj[key] = formatted[key]._errors;
        }
    }

    return res.status(400).json({
        success: false,
        errors: errorObj,
    });
}