# payone-passport-js
Payone ICAO Passport Standard Checker

### SETUP
Install Face API JS
> 		npm i face-api.js

Download face  api models
> https://github.com/oluwatobimaxwell/payone-passport-js/tree/main/models

Place models in public directory
> e.g. "/models"


### USAGE


    const config = { input: img, MODEL_URL: "/models" };
            new Passport(config).then(res => {
                console.log(res)
                setresult(res?.data?.image)
                setstatus(res?.message)
            }).catch(err => {
                console.log(err)
                setresult(err?.data?.image)
                setstatus(err?.message)
            })
			
			
			
### RESULT OBJECT




       {
      "status": false,
      "message": "Person expression should be neutral or normal. No smile, laugh, sadness, surprise, fear!",
      "data": {
        "image": "base64 Image string",
        "score":  0.5676024556159973, // image score
        "dimension": {
          "width": 238.90228271484375, // width
          "height": 318.536376953125 // height
        },
        "size": 0,
        "faces": 1, // face count
        "parts": {
          "nose": true,
          "mouth": true,
          "leftEye": true,
          "rightEye": true,
          "jaw": true
        },
        "expression": "happy"
      }
    }
