const sanitizeString = (str: string | undefined): string => {
	return str ? str.replace(/[^\w\s.,'’-]/g, "").trim() : "";
};

export default sanitizeString;
