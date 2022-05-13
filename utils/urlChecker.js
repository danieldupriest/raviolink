import url from "node:url";

export default (input) => {
    try {
        const newUrl = url.parse(input);
    } catch {
        return false;
    }
    return true;
};
