// iptv.js

(function () {
    'use strict';

    let network = Lampa.Network;
    let storage = Lampa.Storage;
    let manifest = Lampa.Manifest;
    let activity = Lampa.Activity;
    let controller = Lampa.Controller;
    let card = Lampa.Card;
    let empty = Lampa.Empty;
    let lang = Lampa.Lang;

    // URL вашего M3U-плейлиста (можно сделать настраиваемым)
    const PLAYLIST_URL = 'https://example.com/playlist.m3u'; // ← замените на ваш URL

    function init() {
        // Добавляем пункт в главное меню
        manifest.add('iptv', {
            title: 'IPTV',
            icon: 'fa-television',
            in_search: false,
            onRender: render
        });
    }

    function render() {
        let html = $('<div></div>');
        let scroll = new Lampa.Scroll({
            mask: true,
            over: true
        });

        html.append(scroll.render());

        let items = [];
        let loaded = false;

        // Загрузка плейлиста
        network.silent(PLAYLIST_URL, (result) => {
            loaded = true;
            if (result && result.status === 200) {
                let channels = parseM3U(result.text);
                channels.forEach((ch) => {
                    let item = card.render(ch);
                    item.on('hover:focus', () => {
                        item.find('.card__title').addClass('card__title--active');
                    }).on('hover:blur', () => {
                        item.find('.card__title').removeClass('card__title--active');
                    }).on('click', () => {
                        playChannel(ch);
                    });
                    items.push(item);
                });
            } else {
                items.push(empty.render());
            }

            scroll.append(items);
            scroll.loading(false);
            scroll.render();
        });

        scroll.append([empty.render()]);
        scroll.loading(true);
        scroll.render();

        activity.loader(false);
        activity.back = () => {
            Lampa.Activity.backward();
        };

        activity.display(html);
        activity.title = 'IPTV';

        controller.add('content', {
            toggle: () => {
                scroll.toggle();
            },
            up: () => {
                scroll.move(-1);
            },
            down: () => {
                scroll.move(1);
            },
            right: () => {
                scroll.move(10);
            },
            left: () => {
                scroll.move(-10);
            },
            back: () => {
                activity.back();
            }
        });

        controller.toggle('content');
    }

    // Парсинг M3U
    function parseM3U(text) {
        let lines = text.split('\n');
        let channels = [];
        let current = null;

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            if (line.startsWith('#EXTINF:')) {
                // Извлекаем название и логотип
                let match = line.match(/#EXTINF:-?\d+.*?,(.+)/);
                let name = match ? match[1].trim() : 'Без названия';

                let logoMatch = line.match(/tvg-logo="([^"]+)"/);
                let logo = logoMatch ? logoMatch[1] : '';

                current = {
                    title: name,
                    img: logo,
                    source: 'iptv'
                };
            } else if (line.startsWith('http') && current) {
                current.url = line;
                channels.push(current);
                current = null;
            }
        }

        return channels;
    }

    // Воспроизведение канала
    function playChannel(channel) {
        Lampa.Player.play({
            url: channel.url,
            title: channel.title,
            poster: channel.img,
            source: 'iptv'
        });
    }

    // Инициализация плагина
    window.plugin = {
        start: init
    };
})();