import * as faceapi from 'face-api.js';

const constraints = {
    width: 384,
    height: 384
}

class Passport {
    constructor({ input, showLandMark, MODEL_URL }){
        this.input = input;
        this.canvas =  document.createElement("canvas");
        this.showLandMark = showLandMark;
        this.MODEL_URL = MODEL_URL;
        return this.run()
    }
   
    run =  async () => {
        await this.loadModels();
        await this.detectFaces();
        await this.getFaceParts();
        const result = this.results();
        return new Promise((resolve, reject) => {
            if(result?.status){
                resolve(result)
            }else{
                reject(result)
            }
          });
    }

    loadModels = async () => {
        const MODEL_URL = this.MODEL_URL;
        await faceapi.loadSsdMobilenetv1Model(MODEL_URL);  
        await faceapi.loadFaceLandmarkModel(MODEL_URL);   
        await faceapi.loadFaceRecognitionModel(MODEL_URL);
        await faceapi.loadFaceExpressionModel(MODEL_URL);
        this.faceapi = faceapi;
    }

    detectFaces = async () => {
        this.fullFaceDescriptions = await this.faceapi
                                    .detectAllFaces(this.input)
                                    .withFaceLandmarks()
                                    .withFaceDescriptors()
                                    .withFaceExpressions();
        this.faceapi.matchDimensions(this.canvas, this.input);
        this.fullFaceDescriptions = this.faceapi.resizeResults(this.fullFaceDescriptions, this.input);
        this.faceapi.draw.drawDetections(this.canvas, this.fullFaceDescriptions);
        if(this.showLandMark){
            this.faceapi.draw.drawFaceLandmarks(this.canvas, this.fullFaceDescriptions);
        }
        console.log("Landmarks", this.fullFaceDescriptions[0])

        if(this?.fullFaceDescriptions?.length > 0)this.oneface = this.fullFaceDescriptions[0]
    }

    getPassportDimens = (faceWidth, faceHeight, posX, posY) => {


        let width = faceWidth/0.53125;
        let height =  width/0.75;
        const dX = height/2 - faceWidth/2;
        const dY = height/2 - faceHeight/2;
        const x = posX - dX;
        const y = posY - dY;

        return { width: height, height, x, y }
    }

    getFaceParts = async () => {
        const marks = this.oneface;
        const unshift = marks?.unshiftedLandmarks;
        const landmarks = marks?.landmarks;
        
        console.log("Nose: ", unshift?.getNose())
        console.log("mouth: ", unshift?.getMouth())
        console.log("leftEye: ", unshift?.getLeftEye())
        console.log("rightEye: ", unshift?.getRightEye())
        console.log("jaw: ", unshift?.getJawOutline())
        
        this.faceParts = {
            nose: unshift?.getNose()?.length > 0 ? true : false,
            mouth: unshift?.getMouth()?.length > 0 ? true : false,
            leftEye: unshift?.getLeftEye()?.length > 0 ? true : false,
            rightEye: unshift?.getRightEye()?.length > 0 ? true : false,
            jaw: unshift?.getJawOutline()?.length > 0 ? true : false,
        }
        
        const expressions = marks?.expressions || {};
        const max = Math.max.apply(null, Object.values(expressions))
        this.expression = Object.keys(expressions).find(key => expressions[key] === max);

        // Box 
        const align = marks?.alignedRect;
        this.detectScore = align?._score;
        const ctx = this.canvas.getContext('2d');
        const { _imgDims, _shift } = landmarks;


        // this.image = this.canvas.toDataURL('image/jpeg', 1.0);
        const sampleBg = await this.getBGSample(this.input, _imgDims._width);
        this.image = sampleBg?.src;
        this.backgroundColor = this.getAverageRGB(sampleBg);
        
        this.runChecks();
        // Get background sample
    }

     bgColorWhiteCheck = (color) => {
        const brightness = ((color.r * 299) + (color.g * 587) + (color.b * 114)) / 1000;
        return brightness > 225;
    }

    getBGSample = (image, faceWidth) => {
        let sampleWidth = (image.naturalWidth - faceWidth) * 8;
        const sample = new Image();
        let canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, sampleWidth, sampleWidth);
        sample.src = canvas.toDataURL("image/png", 1.0);
        // alert(image.naturalWidth + " - "+ faceWidth)
        return new Promise((resolve, reject) => { resolve(sample); });

        // return sample;
    }


    getAverageRGB =(imgEl) => {
        var blockSize = 5, // only visit every 5 pixels
            defaultRGB = {r:0,g:0,b:0}, // for non-supporting envs
            canvas = document.createElement('canvas'),
            context = canvas.getContext && canvas.getContext('2d'),
            data, width, height,
            i = -4,
            length,
            rgb = {r:0,g:0,b:0},
            count = 0;
    
        if (!context) {
            return defaultRGB;
        }
    
        height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
        width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;
    
        context.drawImage(imgEl, 0, 0);
    
        try {
            data = context.getImageData(0, 0, width, height);
        } catch(e) {
            console.log(e)
            /* security error, img on diff domain */
            return defaultRGB;
        }
    
        length = data.data.length;
    
        while ( (i += blockSize * 4) < length ) {
            ++count;
            rgb.r += data.data[i];
            rgb.g += data.data[i+1];
            rgb.b += data.data[i+2];
        }
    
        // ~~ used to floor values
        rgb.r = ~~(rgb.r/count);
        rgb.g = ~~(rgb.g/count);
        rgb.b = ~~(rgb.b/count);
    
        return rgb;
    }

    runChecks = () => {
        
        if(!this.bgColorWhiteCheck(this.backgroundColor)){
            this.status = false;
            this.message = `Background color must be white!`;
            return;
        }

        if(this.input.naturalHeight !== constraints.height && this.input.naturalWidth !== constraints.width){
            this.status = false;
            this.message = `Image width and height must be 4inch (384px)`;
            return;
        }


        // Count faces
        const faces = this.fullFaceDescriptions.length; 
        if(!(faces === 1)) {
            this.status = false;
            this.message = `${faces} faces present. There must be exactly one face present in the image`;
            return;
        }

        const { nose, mouth, leftEye, rightEye, jaw } = this.faceParts;
        if(nose !== true || mouth !== true || leftEye !== true || rightEye !== true || jaw !== true){
            this.status = false;
            this.message = "Atleast one facial part is not visible";
            return;
        }

        if(this.expression !== "neutral"){
            this.status = false;
            this.message = "Person expression should be neutral or normal. No smile, laugh, sadness, surprise, fear!"
            return;
        }

        this.status = true;
        this.message = "Standard checked, image is valid."
    }

    results = () => {
        return {
            status: this.status || false,
            message: this.message || "Unknown result",
            data: {
                image:  this.input.src,
                score: this.detectScore,
                dimension: {
                    width: this.input?.naturalWidth,
                    heigth: this.input?.naturalHeight,
                },
                size: 0,
                faces: this.fullFaceDescriptions?.length,
                parts: this.faceParts,
                expression: this.expression,
                backgroundColor: this.backgroundColor
            }
        } 
    }

}


export default Passport;
