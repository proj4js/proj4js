module.exports = {
  "env":{
    "browser":true,
    "node":true,
    "es6": true
  },
  "parserOptions": {
    "sourceType": "module",
  },
  "rules":{
    "curly":2,
    "eqeqeq":2,
    "no-use-before-define":[2, 
      {
        "functions":false
      }
    ],
    "no-undef":2,
    "no-unused-vars":2,
    "indent": ["error", 2],
  }
}