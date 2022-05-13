const errorHandler = (err, req, res, next) => {
    res.status(500);
    res.send("Server error: " + err);
};

export default errorHandler;
