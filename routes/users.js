var express = require("express");
var router = express.Router();

/* GET users listing. */
router.get("/", function (req, res, next) {
  console.log("debug something dasdasdsa");
  res.send("respond with a fffff");
});

module.exports = router;
