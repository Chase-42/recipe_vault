import { type FlaskApiResponse } from "~/lib/schemas";
import { schemas } from "~/lib/schemas";
import { getErrorMessage } from "~/lib/errors";

const baseUrl = process.env.NODE_ENV === "development" 
    ? "http://localhost:3000/" 
    : `${process.env.NEXT_PUBLIC_DOMAIN}/`;

const flaskApiUrl = (link: string): URL => 
    new URL(`api/scraper?url=${encodeURIComponent(link)}`, baseUrl);

async function fetchDataFromFlask(link: string): Promise<FlaskApiResponse> {
    try {
        const response: Response = await fetch(flaskApiUrl(link).toString(), {
            headers: { Accept: "application/json" },
            next: { revalidate: 0 },
        });

        const data = await response.json() as Record<string, unknown>;

        // If we get a 422 or if the response is not ok, return empty data
        if (response.status === 422 || !response.ok) {
            console.log('Flask API returned error or 422:', {
                status: response.status,
                data
            });
            return {
                name: undefined,
                imageUrl: undefined,
                instructions: undefined,
                ingredients: undefined
            };
        }

        // Try to parse the response, but if it fails, return empty data
        try {
            return schemas.flaskApiResponse.parse(data);
        } catch (parseError) {
            console.log('Failed to parse Flask API response:', {
                error: getErrorMessage(parseError),
                data
            });
            return {
                name: undefined,
                imageUrl: undefined,
                instructions: undefined,
                ingredients: undefined
            };
        }
    } catch (error) {
        console.log('Flask API request failed:', getErrorMessage(error));
        return {
            name: undefined,
            imageUrl: undefined,
            instructions: undefined,
            ingredients: undefined
        };
    }
}

export const flaskApiService = {
    fetchDataFromFlask,
}; 