import Helper from '../NiiceLibrary';

let AutoAccept = false;

function OnClickAutoAcceptToggleButton() {
    let wrapperDiv = document.querySelector('.auto-accept-toggle-wrapper');
    let video = document.querySelector('.auto-select-status-card-bg-container video');
    let text = document.querySelector('.auto-select-status-card-header-text');

    if (wrapperDiv.classList.contains('closed')) {
        wrapperDiv.classList.remove('closed');
        wrapperDiv.classList.add('open');
        wrapperDiv.classList.add('right');

        video.setAttribute('src', '/fe/lol-parties/party-status-bg-loop.webm');
        text.textContent = 'Auto accept enabled';
        AutoAccept = true;

        DataStore.set('NiiceAutoAccept', AutoAccept);
    } else if (wrapperDiv.classList.contains('open')) {
        wrapperDiv.classList.add('closed');
        wrapperDiv.classList.remove('open');
        wrapperDiv.classList.remove('right');

        video.setAttribute('src', '/fe/lol-parties/social-panel-bg-loop.webm');
        text.textContent = 'Auto accept disabled';

        DataStore.set('NiiceAutoAccept', AutoAccept);
    }
}

function RemoveAutoAcceptInformationPanel() {
    let autoSelectionDiv = document.querySelector('.auto-select-section');

    if (autoSelectionDiv == null)
        return;

    autoSelectionDiv.remove();
}

function CreateAutoAcceptInformationPanel() {
    let identityPartiesDiv = document.querySelector('.identity-and-parties');

    if (identityPartiesDiv == null)
        return;

    if (document.querySelector('.auto-select-section') != null)
        return;

    let autoSelectSection = Helper.AddElement(identityPartiesDiv, 'div', [], ['auto-select-section', 'use-animation']);
    let panelContentDiv = Helper.AddElement(autoSelectSection, 'div', [], ['auto-select-info-panel-content']);
    let statusCardDiv = Helper.AddElement(panelContentDiv, 'div', [], ['auto-select-status-card']);
    let statusCardBackgroundDiv = Helper.AddElement(statusCardDiv, 'div', [], ['auto-select-status-card-bg-container']);
    Helper.AddElement(statusCardBackgroundDiv, 'video', [{name: 'no-controls', value: 'true'}, {name: 'preload', value: 'auto'}, {name: 'autoplay', value: 'true'}, {name: 'loop', value: 'true'}, {name: 'src', value: AutoAccept ? '/fe/lol-parties/party-status-bg-loop.webm' : '/fe/lol-parties/social-panel-bg-loop.webm'}]);
    let statusCardHeaderDiv = Helper.AddElement(statusCardDiv, 'div', [], ['auto-select-status-card-header']);
    Helper.AddElement(statusCardHeaderDiv, 'div', [], ['auto-select-status-card-header-icon']);
    Helper.AddElement(statusCardHeaderDiv, 'div', [], ['auto-select-status-card-header-text'], 'Auto accept ' + (AutoAccept ? 'enabled' : 'disabled'));
}

function CreateAutoAcceptToggleButton() {
    let buttonContainer = document.querySelector('.lobby-header-buttons-container');

    if (buttonContainer == null)
        return;

    if (document.querySelector('.auto-accept-toggle') != null)
        return;

    let emberDiv = Helper.AddElement(buttonContainer, 'div', [], ['auto-accept-toggle', 'ember-view']);
    emberDiv.addEventListener('click', OnClickAutoAcceptToggleButton);

    let wrapperDivClasses = ['auto-accept-toggle-wrapper'];

    if (AutoAccept)
        wrapperDivClasses.push('open', 'right'); else wrapperDivClasses.push('closed');

    let wrapperDiv = Helper.AddElement(emberDiv, 'div', [], wrapperDivClasses);
    let containerDiv = Helper.AddElement(wrapperDiv, 'div', [], ['toggle-container', 'animated']);
    Helper.AddElement(containerDiv, 'div', [], ['open']);
    Helper.AddElement(containerDiv, 'div', [], ['toggle-button', 'animated']);
}

let QueueAccepted = false;

function OnGameflowPhase(message) {
    let phase = JSON.parse(message['data'])[2]['data'];

    if (phase === "ReadyCheck" && !QueueAccepted && AutoAccept) {
        setTimeout(async () => {
            await fetch('/lol-matchmaking/v1/ready-check/accept', {method: 'POST'});
        }, 1000);

        QueueAccepted = true
    } else if (phase !== "ReadyCheck") {
        QueueAccepted = false
    }
}

window.addEventListener('load', () => {
    if (DataStore.has('NiiceAutoAccept')) AutoAccept = DataStore.get('NiiceAutoAccept');

    Helper.AddStylesheet('//plugins/NiiceAutoAccept/assets/style.css');

    Helper.SubscribeEndpoint('/lol-gameflow/v1/gameflow-phase', OnGameflowPhase);

    window.setInterval(async () => {
        await fetch('/lol-gameflow/v1/gameflow-phase', {method: 'GET'}).then(response => response.text())
            .then(data => {
                if (data === '"Lobby"' || data === '"Matchmaking"' || data === '"ReadyCheck"')
                    CreateAutoAcceptInformationPanel();
                else
                    RemoveAutoAcceptInformationPanel();
            });
        CreateAutoAcceptToggleButton();
    }, 500);
});