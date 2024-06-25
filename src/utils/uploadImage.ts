import { UploadClient, type UploadcareFile } from "@uploadcare/upload-client";

const publicKey = process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY;

if (!publicKey) {
	throw new Error("Uploadcare public key is not defined");
}

const client = new UploadClient({ publicKey });

interface UploadResponse extends UploadcareFile {
	cdnUrl: string;
}

export const uploadImage = async (imageUrl: string): Promise<string> => {
	try {
		const file: UploadResponse = (await client.uploadFile(imageUrl, {
			fileName: "recipe-image",
			source: "url",
		})) as UploadResponse;

		if (!file.cdnUrl) {
			throw new Error("Failed to upload image: No CDN URL returned");
		}

		return file.cdnUrl;
	} catch (error) {
		console.error("Failed to upload image to Uploadcare", error);
		throw new Error("Failed to upload image");
	}
};
