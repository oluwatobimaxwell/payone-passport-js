/* eslint-disable jsx-a11y/img-redundant-alt */
import React from 'react';
import Passport from '../src/Passport';

export const Example = () => {
    const [result, setresult] = React.useState()
    const [status, setstatus] = React.useState("")

    React.useEffect(() => {
        setstatus("Processing...")
        const img = document.createElement("img")
        img.src = require("./images/side-person.jpg").default;

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
            {result && (<img id="result-image" src={result} alt={"Output image"} />)}
            <p>{status}</p>
        </div>
    )
}
