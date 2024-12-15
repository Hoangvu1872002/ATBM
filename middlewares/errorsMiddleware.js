const errorsMiddleware = (err, req, res, next) => {
  res.status(400);
  res.json({
    mes: err.message,
  });
};
module.exports = {
  errorsMiddleware,
};
