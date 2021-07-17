import * as faceapi from 'face-api.js';
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
        this.getFaceParts();
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
        const dX = width/2 - faceWidth/2;
        const dY = height/2 - faceHeight/2;
        const x = posX - dX;
        const y = posY - dY;
        return { width, height, x, y }
    }

    getFaceParts = () => {
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
        const size = align?._imageDims;

        const box = align?._box;
        const ctx = this.canvas.getContext('2d');
        // ctx.drawImage(this.input, box._x, box._y, size?._width, size?._height);
        console.log("Data: ", box)
        console.log("Size: ", size)

        const { _imgDims, _shift } = landmarks;

        const passport = this.getPassportDimens(_imgDims._width, _imgDims._height, _shift._x, _shift._y)
        
        //
        ctx.canvas.width  = passport.width;
        ctx.canvas.height = passport.height;
        this.imageDimension = {
            width: passport.width,
            height: passport.height
        }

        ctx.drawImage(
                        this.input, 
                        passport.x, passport.y, passport.width, passport.height,
                        0, 0, passport.width, passport.height
                    );
        ctx.canvas.style.backgroundColor = '#fff'
        this.image = this.canvas.toDataURL('image/jpeg', 1.0)
        this.runChecks();
    }

    runChecks = () => {
        
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
                image: this.image,
                score: this.detectScore,
                dimension: this.imageDimension,
                size: 0,
                faces: this.fullFaceDescriptions?.length,
                parts: this.faceParts,
                expression: this.expression
            }
        } 
    }

}


export default Passport;