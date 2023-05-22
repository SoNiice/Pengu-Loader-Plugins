import Helper from '../NiiceLibrary';

function AddContextMenu(title, subTitle, items = []) {
    let container = Helper.AddElement(document.body, 'div', [
        {
            name: 'style',
            value: 'position: absolute; z-index: 10000; left: 63px; top: 310px;'
        }
    ], ['niice-loot-helper-context-menu']);

    let contextMenu = Helper.AddElement(container, 'div', [], ['context-menu', 'loot-context-menu', 'context-menu-root']);
    let header = Helper.AddElement(contextMenu, 'div', [], ['context-menu-header', 'disabled']);
    Helper.AddElement(header, 'div', [], ['title'], '<h5>' + title + '</h5>');
    Helper.AddElement(header, 'div', [], [], subTitle);
    Helper.AddElement(header, 'hr', [], ['separator']);

    items.forEach(item => {
        let menuItem = Helper.AddElement(contextMenu, 'div', [], ['context-menu-item']);

        if (item.actionIcon != null && item.actionIcon !== '')
            Helper.AddElement(menuItem, 'div', [{
                name: 'style',
                value: 'background-image: url("' + item.actionIcon + '");'
            }], ['action-icon']);

        Helper.AddElement(menuItem, 'div', [], [], '<span class="action-name">' + item.title + '</span> ' + item.subTitle);

        if (item.essenceIcon != null && item.essenceIcon !== '')
            Helper.AddElement(menuItem, 'div', [], ['essence-icon', 'pull-right'], '<img src="' + item.essenceIcon + '"/>');

        let essenceTextClasses = ['pull-right', 'essence-container', 'essence-text'];

        if (item.essenceText != null && item.essenceText.toString().includes('-'))
            essenceTextClasses.push('negative-text');

        Helper.AddElement(menuItem, 'div', [], essenceTextClasses, item.essenceText);
        Helper.AddElement(menuItem, 'div', [], ['disabled-overlay']);

        if (item.clickEvent != null)
            menuItem.addEventListener('click', item.clickEvent);
    });
}

function OnClickRefreshButton() {
    document.querySelectorAll('.loot-category-information').forEach(elem => {
        elem.remove();
    });
}

function OnClickOpenChestsButton() {
    let contextMenu = document.querySelector('.niice-loot-helper-context-menu');

    if (contextMenu != null)
        return;

    Helper.GetLoot().then(loot => {
        let items = [];

        loot.chests.forEach(chest => {
            items.push({
                title: 'Open',
                subTitle: chest.name,
                // actionIcon: '/fe/lol-loot/assets/tray_icons/MATERIAL_key.png',
                // essenceIcon: '/fe/lol-loot/assets/tray_icons/chest_generic.png',
                essenceText: chest.data.count,
                clickEvent: async () => {
                    if (window.confirm('Do you really wanna open all ' + chest.name + '?')) {
                        await fetch('/lol-loot/v1/recipes/' + chest.id + '_OPEN/craft?repeat=' + chest.data.count, {
                            method: 'POST',
                            body: JSON.stringify([chest.id]),
                            headers: {
                                "Content-Type": "application/json"
                            }
                        }).then(async (response) => {
                            if (response.status === 500) {
                                await fetch('/lol-loot/v1/recipes/' + chest.id + '_OPEN/craft?repeat=' + chest.data.count, {
                                    method: 'POST',
                                    body: JSON.stringify([chest.id, "MATERIAL_key"]),
                                    headers: {
                                        "Content-Type": "application/json"
                                    }
                                });
                            }
                        });
                    }

                    let contextMenu = document.querySelector('.niice-loot-helper-context-menu');

                    if (contextMenu != null)
                        contextMenu.remove();
                }
            });
        });

        items.push({
            title: 'Close',
            subTitle: '',
            actionIcon: '',
            essenceIcon: '',
            essenceText: '',
            clickEvent: () => {
                let contextMenu = document.querySelector('.niice-loot-helper-context-menu');

                if (contextMenu != null)
                    contextMenu.remove();
            }
        });

        AddContextMenu('Materials', 'Open chests', items);
    });
}

function OnClickBlueEssenceButton() {
    let contextMenu = document.querySelector('.niice-loot-helper-context-menu');

    if (contextMenu != null)
        return;

    Helper.GetLoot().then(loot => {
        let keyMaps = {};
        let alreadyOwned = [];
        let duplicates = [];

        loot.championShards.forEach(item => {
            if (item.data.itemStatus === "OWNED")
                alreadyOwned.push(item);

            const {id} = item;
            keyMaps[id] = keyMaps[id] ?? [];
            keyMaps[id].push(item);
        });

        Object.keys(keyMaps).forEach(key => {
            if (keyMaps[key].length >= 2) {
                for (let i = 1; i < keyMaps[key].length; i++) {
                    duplicates.push(keyMaps[key][i]);
                }
            }
        });

        let upgradableChampions = [];
        let championShards = loot.championShards.sort((a, b) => (a.data.upgradeEssenceValue > b.data.upgradeEssenceValue) ? 1 : ((b.data.upgradeEssenceValue > a.data.upgradeEssenceValue) ? -1 : 0))
        let blueEssence = loot.blueEssence;

        championShards.forEach(item => {
            if (item.data.itemStatus === "FREE" && blueEssence >= item.data.upgradeEssenceValue) {
                upgradableChampions.push(item);
                blueEssence -= item.data.upgradeEssenceValue;
            }
        });

        AddContextMenu('Blue essence', 'Champion shards', [
            {
                title: 'Disenchant',
                subTitle: 'duplicates',
                actionIcon: '/fe/lol-loot/assets/context_menu/disenchant.png',
                essenceIcon: '/fe/lol-loot/assets/context_menu/currency_champion.png',
                essenceText: '+' + Helper.Sum(duplicates, 'data.disenchantValue'),
                clickEvent: () => {
                    if (window.confirm('Do you really wanna disenchant all duplicates?')) {
                        duplicates.forEach(async (item) => {
                            await fetch('/lol-loot/v1/recipes/CHAMPION_RENTAL_disenchant/craft?repeat=1', {
                                method: 'POST',
                                body: JSON.stringify([item.id]),
                                headers: {
                                    "Content-Type": "application/json"
                                }
                            });
                        });
                    }

                    let contextMenu = document.querySelector('.niice-loot-helper-context-menu');

                    if (contextMenu != null)
                        contextMenu.remove();
                }
            },
            {
                title: 'Disenchant',
                subTitle: 'already owned',
                actionIcon: '/fe/lol-loot/assets/context_menu/disenchant.png',
                essenceIcon: '/fe/lol-loot/assets/context_menu/currency_champion.png',
                essenceText: '+' + Helper.Sum(alreadyOwned, 'data.disenchantValue'),
                clickEvent: () => {
                    if (window.confirm('Do you really wanna disenchant all owned shards?')) {
                        alreadyOwned.forEach(async (item) => {
                            await fetch('/lol-loot/v1/recipes/CHAMPION_RENTAL_disenchant/craft?repeat=1', {
                                method: 'POST',
                                body: JSON.stringify([item.id]),
                                headers: {
                                    "Content-Type": "application/json"
                                }
                            });
                        });
                    }

                    let contextMenu = document.querySelector('.niice-loot-helper-context-menu');

                    if (contextMenu != null)
                        contextMenu.remove();
                }
            },
            {
                title: 'Disenchant',
                subTitle: 'all',
                actionIcon: '/fe/lol-loot/assets/context_menu/disenchant.png',
                essenceIcon: '/fe/lol-loot/assets/context_menu/currency_champion.png',
                essenceText: '+' + Helper.Sum(loot.championShards, 'data.disenchantValue'),
                clickEvent: () => {
                    if (window.confirm('Do you really wanna disenchant all shards?')) {
                        loot.championShards.forEach(async (item) => {
                            await fetch('/lol-loot/v1/recipes/CHAMPION_RENTAL_disenchant/craft?repeat=1', {
                                method: 'POST',
                                body: JSON.stringify([item.id]),
                                headers: {
                                    "Content-Type": "application/json"
                                }
                            });
                        });
                    }

                    let contextMenu = document.querySelector('.niice-loot-helper-context-menu');

                    if (contextMenu != null)
                        contextMenu.remove();
                }
            },
            {
                title: 'Upgrade',
                subTitle: 'all',
                actionIcon: '/fe/lol-loot/assets/context_menu/upgrade.png',
                essenceIcon: '/fe/lol-loot/assets/context_menu/currency_champion.png',
                essenceText: '-' + Helper.Sum(upgradableChampions, 'data.upgradeEssenceValue'),
                clickEvent: () => {
                    if (window.confirm('Do you really wanna upgrade all champion shards?')) {
                        upgradableChampions.forEach(async (item) => {
                            await fetch('/lol-loot/v1/recipes/CHAMPION_upgrade/craft?repeat=1', {
                                method: 'POST',
                                body: JSON.stringify([item.id, "CURRENCY_champion"]),
                                headers: {
                                    "Content-Type": "application/json"
                                }
                            });
                        });
                    }

                    let contextMenu = document.querySelector('.niice-loot-helper-context-menu');

                    if (contextMenu != null)
                        contextMenu.remove();
                }
            },
            {
                title: 'Close',
                subTitle: '',
                actionIcon: '',
                essenceIcon: '',
                essenceText: '',
                clickEvent: () => {
                    let contextMenu = document.querySelector('.niice-loot-helper-context-menu');

                    if (contextMenu != null)
                        contextMenu.remove();
                }
            }
        ]);
    });
}

function CreateBlueEssenceButton() {
    let tabs = document.querySelector('.loot-display-category-tabs-container');

    if (tabs == null)
        return;

    if (document.querySelector('.blue-essence-button-container') != null)
        return;

    let container = Helper.AddElement(tabs, 'div', [], ['blue-essence-button-container']);
    let button = Helper.AddElement(container, 'div', [], ['blue-essence-button']);
    button.addEventListener('click', OnClickBlueEssenceButton);
}

function CreateRefreshButton() {
    let tabs = document.querySelector('.loot-display-category-tabs-container');

    if (tabs == null)
        return;

    if (document.querySelector('.refresh-button-container') != null)
        return;

    let container = Helper.AddElement(tabs, 'div', [], ['refresh-button-container']);
    let button = Helper.AddElement(container, 'div', [], ['refresh-button']);
    button.addEventListener('click', OnClickRefreshButton);
}

function CreateOpenChestsButton() {
    let tabs = document.querySelector('.loot-display-category-tabs-container');

    if (tabs == null)
        return;

    if (document.querySelector('.open-chests-button-container') != null)
        return;

    let container = Helper.AddElement(tabs, 'div', [], ['open-chests-button-container']);
    let button = Helper.AddElement(container, 'div', [], ['open-chests-button']);
    button.addEventListener('click', OnClickOpenChestsButton);
}

function CreateCategoryInformation() {
    let categories = document.querySelectorAll('.display-category-section');

    if (categories == null || categories.length === 0)
        return;

    if (document.querySelector('.loot-category-information') != null)
        return;

    Helper.GetLoot().then(loot => {
        Helper.AddElement(categories[1].querySelector(".title-text"), 'span', [
            {
                name: 'style',
                value: 'margin-left: 5px;'
            }
        ], ['loot-category-information'], '(' + loot.championShards.length + ' shards | Worth ' + Helper.Sum(loot.championShards, 'data.disenchantValue', 'data.count') + ' <img style="margin-bottom: -4px;" src="/fe/lol-loot/assets/context_menu/currency_champion.png"/>)');

        Helper.AddElement(categories[2].querySelector(".title-text"), 'span', [
            {
                name: 'style',
                value: 'margin-left: 5px;'
            }
        ], ['loot-category-information'], '(' + loot.championSkinShards.length + ' shards | Worth ' + Helper.Sum(loot.championSkinShards, 'data.disenchantValue', 'data.count') + ' <img style="margin-bottom: -4px;" src="/fe/lol-loot/assets/context_menu/currency_cosmetic.png"/>)');
    });
}


window.addEventListener('load', () => {
    Helper.AddStylesheet('//plugins/NiiceLootHelper/assets/style.css');

    window.setInterval(async () => {
        CreateRefreshButton();
        CreateOpenChestsButton();
        CreateBlueEssenceButton();
        CreateCategoryInformation();

        let lootTray = document.querySelector('.loot-tray.ember-view');

        if (lootTray != null)
            lootTray.setAttribute('style', 'margin-top: 0px;');
    }, 1000);
});