// src/utils/uploadImage.ts
interface UploadThingResponse {
	uploadedBy: string;
	fileUrl: string;
}

export const uploadImage = async (imageUrl: string): Promise<string> => {
	const response: Response = await fetch("/api/uploadthing", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ fileUrl: imageUrl }),
	});

	if (!response.ok) {
		throw new Error("Failed to upload image");
	}

	const data: UploadThingResponse =
		(await response.json()) as UploadThingResponse;
	return data.fileUrl;
};
