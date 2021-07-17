/* eslint-disable jsx-a11y/img-redundant-alt */
import React from 'react';
import Passport from '../src/Passport';

export const Example = () => {
    const [result, setresult] = React.useState()
    const [status, setstatus] = React.useState("")

    React.useEffect(() => {
        setstatus("Processing...")
        const img = document.createElement("img")
        img.src = require("./images/passport.jpg").default;
        document.getElementById("input-image").src = img.src;
        const config = { input: img, MODEL_URL: "/models" };
        new Passport(config)
        .then(res => {
            console.log(res)
            setresult(res?.data?.image)
            setstatus(res?.message)
        }).catch(err => {
            console.log(err)
            setresult(err?.data?.image)
            setstatus(err?.message)
        })
    }, [])

    return (
        <div>
            <div  style={{ display: "flex" }}>
            <div>
                <p style={{ textAlign: "center" }}>Input Image</p>
            <img id="input-image" alt={"Input image"} style={{ width: 500, height: "auto" }} />
            </div>
            <div>
                <p style={{ textAlign: "center"}}>Output Image</p>
            {result && (<img id="result-image" src={result} alt={"Output image"} style={{ marginLeft: 50 }} />)}
            </div>
            </div>
            <p style={{ padding: 20, border: '2px solid', marginTop: 20, width: "max-content" }}><b>Status: </b> {status}</p>
        </div>
    )
}
