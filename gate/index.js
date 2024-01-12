    const express = require('express')
    const app = express()
    const port = 30000
    const fs = require('fs')

    //const gpioFile = '/home/samuel/gpio17'
    const gpioFile = '/sys/class/gpio/gpio17/value'

    app.post('/', async function (req, res) {
        console.log("got request to open gate")    
        fs.writeFile(gpioFile, '1', function (err, buffer) {
            if (err != null) {
                console.log(err)
            }
        })
        await sleep(500);
        fs.writeFile(gpioFile, '0', function (err, buffer) {
            if (err != null) {
                console.log(err)
            }
        })
        res.send('Hello from the gate!')
    })

    app.listen(port, () => {
        console.log(`Gate app listening at http://localhost:${port}`)
    })

    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
