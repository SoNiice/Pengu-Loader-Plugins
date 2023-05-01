/**
 * @param {string} url
 */
function AddStylesheet(url) {
    let style = document.createElement('link');
    style.href = url;
    style.type = 'text/css';
    style.rel = 'stylesheet';

    document.body.append(style);
}

/**
 * @param {string} endpoint
 * @param {(this:WebSocket, ev: MessageEvent) => *} callback
 */
function SubscribeEndpoint(endpoint, callback) {
    const uri = document.querySelector('link[rel="riot:plugins:websocket"]').href
    const ws = new WebSocket(uri, 'wamp')

    ws.onopen = () => ws.send(JSON.stringify([5, 'OnJsonApiEvent' + endpoint.replace(/\//g, '_')]))
    ws.onmessage = callback
}

/**
 * @param {Element} parent
 * @param {string} tag
 * @param {Array} params
 * @param {Array} classes
 * @param {?string} content
 * @return HTMLElement
 */
function AddElement(parent, tag, params = [], classes = [], content = null) {
    let element = document.createElement(tag);

    params.forEach(param => element.setAttribute(param.name, param.value));
    classes.forEach(className => element.classList.add(className));

    if (content) element.innerHTML = content;

    parent.append(element);

    return element;
}

export default {
    AddStylesheet: AddStylesheet,
    SubscribeEndpoint: SubscribeEndpoint,
    AddElement: AddElement
}