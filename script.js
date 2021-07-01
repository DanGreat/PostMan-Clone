import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import axios from 'axios'
import prettyBytes from 'pretty-bytes'
import setupEditor from './setupEditor'

// Request selector
const form = document.querySelector('[data-form]')
const queryParamsContainer = document.querySelector('[data-query-params]')
const requestHeadersContiner = document.querySelector('[data-request-headers]')
const keyValueTemplate = document.querySelector('[data-key-value-template]')
const spinner = document.querySelector('[data-spinner]')

// Response selector
const responseHeadersContainer = document.querySelector('[data-response-headers]')

queryParamsContainer.append(createKeyValuePair())
requestHeadersContiner.append(createKeyValuePair())


// For the Add Buttons
const queryParamsAddBtn = document.querySelector('[data-add-query-params-btn]')
const requestHeadersAddBtn = document.querySelector('[data-add-request-headers-btn]')

queryParamsAddBtn.addEventListener('click', () => {
    queryParamsContainer.append(createKeyValuePair())
})

requestHeadersAddBtn.addEventListener('click', () => {
    requestHeadersContiner.append(createKeyValuePair())
})

axios.interceptors.request.use(request => {
    request.customData = request.customData || {}
    request.customData.startTime = new Date().getTime()

    return request
})

axios.interceptors.response.use(updateEndTime, e => {
    return Promise.reject(updateEndTime(e.response))
})

function updateEndTime(response){
    response.customData = response.customData || {}
    response.customData.time = new Date().getTime() - response.config.customData.startTime

    return response
}


// Populate the Params and headers with a key value pair
function createKeyValuePair() {
    const element = keyValueTemplate.content.cloneNode(true)
    element.querySelector('[data-remove-btn]').addEventListener('click', e => {
        e.target.closest('[data-key-value-pair]').remove();
    })

    return element
}

const { requestEditor, updateResponseEditor } = setupEditor()
form.addEventListener('submit', e => {
    e.preventDefault()
    spinner.classList.remove('d-none')

    let data
    try{
        data = JSON.parse(requestEditor.state.doc.toString() || null)
    }catch(e){
        alert('JSON data is malformed')
        return
    }

    axios({
        url: document.querySelector('[data-url]').value,
        method: document.querySelector('[data-method]').value,
        params: keyValuePairToObject(queryParamsContainer),
        headers: keyValuePairToObject(requestHeadersContiner),
        data
    })
    .catch(e => e)
    .then(response => {
        document.querySelector("[data-response-section]").classList.remove("d-none")
        updateResponseDetails(response)
        updateResponseEditor(response.data)
        updateResponseHeaders(response.headers)
        spinner.classList.add('d-none')
    })

})

// Convert key value pair to object
function keyValuePairToObject(container){
    const pairs = container.querySelectorAll('[data-key-value-pair]')
    return [...pairs].reduce((data, pair) => {

        const key = pair.querySelector('[data-key]').value
        const value = pair.querySelector('[data-value]').value

        if(key  === '') return data

        return {...data, [key]: value}

    }, {})
    
}

//Updates the response headers with values gotten
function updateResponseHeaders(headers){
    responseHeadersContainer.innerHTML = ""
    Object.entries(headers).forEach(([key, value]) => {

        const keyElement = document.createElement("div")
        keyElement.textContent = key
        responseHeadersContainer.append(keyElement)

        const valueElement = document.createElement("div")
        valueElement.textContent = value
        responseHeadersContainer.append(valueElement)
    })
}

// Updates Response Details
function updateResponseDetails(response){
    document.querySelector("[data-status]").textContent = response.status
    document.querySelector("[data-time]").textContent = response.customData?.time
    document.querySelector("[data-size]").textContent = prettyBytes(
        JSON.stringify(response.data)?.length + JSON.stringify(response.headers)?.length)
}