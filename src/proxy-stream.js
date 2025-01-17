ProxyStream = {
    channel: null,
    hls: null,
    currentQuality: null,
    qualities: [],

    getPlaylist: async function (channel,) {
        try {
            return await chrome.runtime.sendMessage({
                type: 'fetchText',
                url: `https://%APIURL%/getTwitchPlaylist?channel=${channel}`
            });
        } catch (error) {
            console.log(`'Twitch Anti-Ban: unable to fetch playlist: ${error}`);
            return null;
        }
    },

    convertToPlaylistBlob: function (playlist) {
        const blob = new Blob([playlist], {type: 'application/vnd.apple.mpegurl'});
        return URL.createObjectURL(blob);
    },

    getStreamPlaylist: function (channel) {
        return ProxyStream.getPlaylist(channel)
            .then(playlist => {
                if (!playlist) {
                    console.log('Twitch Anti-Ban: Stream is offline');
                    return null;
                }
                ProxyStream.qualities = [];
                const lines = playlist.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes('#EXT-X-STREAM-INF:')) {
                        const resMatch = lines[i].match(/RESOLUTION=(\d+x\d+)/);
                        const fpsMatch = lines[i].match(/FRAME-RATE=([\d.]+)/);
                        if (resMatch) {
                            const [width, height] = resMatch[1].split('x');
                            let quality = `${height}p`;
                            if (fpsMatch) {
                                const fps = parseFloat(fpsMatch[1]);
                                if (fps > 30) {
                                    quality += fps.toFixed(0);
                                }
                            }   
                            if (!ProxyStream.qualities.includes(quality)) {
                                ProxyStream.qualities.push(quality);
                            }
                        }
                    }
                }
                ProxyStream.qualities.sort((a, b) => {
                    return parseInt(b) - parseInt(a);
                });
                return ProxyStream.convertToPlaylistBlob(playlist);
            });
    },

    restoreOriginalPlayer: function () {
        let streamContainer = $('[data-a-target="video-player"]');
        streamContainer.css("display", "block");
        $('#anti-ban-stream').remove();
        if (ProxyStream.hls) {
            ProxyStream.hls.destroy();
            ProxyStream.hls = null;
        }
        ProxyStream.channel = null;
    },

    createPlayerTemplate: function() {
        const qualityMenuItems = ProxyStream.qualities.map(quality => 
            `<div class="anti-ban-quality-option" data-quality="${quality}">${quality}</div>`
        ).join('');

        return `
            <div id="anti-ban-stream">
                <div class="anti-ban-video-player-container">
                    <video id="anti-ban-stream-player" class="anti-ban-video-player"></video>
                    <div class="anti-ban-video-controls">
                        <button class="anti-ban-play-pause-btn">⏵</button>
                        <div class="anti-ban-volume-container">
                            <button class="anti-ban-volume-btn">🔊</button>
                            <input type="range" class="anti-ban-volume-slider" min="0" max="100" value="100">
                        </div>
                        <div class="anti-ban-quality-control">
                            <button class="anti-ban-quality-selector">${ProxyStream.qualities[0] || 'Quality'} ▾</button>
                            <div class="anti-ban-quality-menu">
                                ${qualityMenuItems}
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    initPlayerControls: function() {
        const container = $('#anti-ban-stream');
        const video = document.getElementById('anti-ban-stream-player');
        const playPauseBtn = container.find('.anti-ban-play-pause-btn');
        const volumeBtn = container.find('.anti-ban-volume-btn');
        const volumeSlider = container.find('.anti-ban-volume-slider');
        const qualityBtn = container.find('.anti-ban-quality-selector');
        const qualityMenu = container.find('.anti-ban-quality-menu');

        playPauseBtn.on('click', () => {
            if (video.paused) {
                if (ProxyStream.hls.liveSyncPosition) {
                    video.currentTime = ProxyStream.hls.liveSyncPosition;
                }
                video.play();
                playPauseBtn.text('⏸');
            } else {
                video.pause();
                playPauseBtn.text('⏵');
            }
        });

        video.addEventListener('play', () => {
            playPauseBtn.text('⏸');
            if (ProxyStream.hls.liveSyncPosition) {
                video.currentTime = ProxyStream.hls.liveSyncPosition;
            }
        });
        video.addEventListener('pause', () => playPauseBtn.text('⏵'));

        let lastVolume = 1;
        const updateVolumeSlider = (value) => {
            volumeSlider[0].style.background = `linear-gradient(to right, #9147ff 0%, #9147ff ${value}%, rgba(255, 255, 255, 0.2) ${value}%)`;
        };

        updateVolumeSlider(100);

        volumeSlider.on('input', (e) => {
            const value = e.target.value;
            const volume = value / 100;
            video.volume = volume;
            volumeBtn.text(volume === 0 ? '🔇' : '🔊');
            lastVolume = volume || 1;
            updateVolumeSlider(value);
        });

        volumeBtn.on('click', () => {
            if (video.volume > 0) {
                video.volume = 0;
                volumeSlider.val(0);
                volumeBtn.text('🔇');
                updateVolumeSlider(0);
            } else {
                video.volume = lastVolume;
                const value = lastVolume * 100;
                volumeSlider.val(value);
                volumeBtn.text('🔊');
                updateVolumeSlider(value);
            }
        });

        qualityBtn.on('click', (e) => {
            e.stopPropagation();
            const isVisible = qualityMenu.hasClass('active');
            $('.anti-ban-quality-menu').removeClass('active');

            if (!isVisible) {
                qualityMenu.addClass('active');
            }
        });

        qualityMenu.find('.anti-ban-quality-option').on('click', function(e) {
            e.stopPropagation();
            const quality = $(this).data('quality');

            if (ProxyStream.hls && ProxyStream.hls.levels) {
                const height = parseInt(quality.replace(/p.*$/, ''));
                const levelIndex = ProxyStream.hls.levels.findIndex(level => {
                    return level.height === height;
                });

                if (levelIndex !== -1) {
                    ProxyStream.hls.nextLevel = levelIndex;
                    qualityMenu.find('.anti-ban-quality-option').removeClass('active');
                    $(this).addClass('active');
                    qualityBtn.html(`${quality} ▾`);
                }
            }
            qualityMenu.removeClass('active');
        });

        $(document).on('click', (e) => {
            if (!$(e.target).closest('.anti-ban-quality-control').length) {
                qualityMenu.removeClass('active');
            }
        });

        container.on('mouseleave', () => {
            qualityMenu.removeClass('active');
        });
    },

    initStream: function (channel) {
        ProxyStream.channel = channel;
        let streamContainer = $('[data-a-target="video-player"]');
        streamContainer.css("display", "none");

        if (Hls.isSupported()) {
            ProxyStream.getStreamPlaylist(channel).then(function (playlist) {
                if (!playlist) {
                    return;
                }
                streamContainer.parent().append(ProxyStream.createPlayerTemplate());
                let video = document.getElementById('anti-ban-stream-player');

                ProxyStream.hls = new Hls({
                    startLevel: -1,
                    capLevelToPlayerSize: true,
                    autoLevelCapping: -1
                });

                ProxyStream.hls.loadSource(playlist);
                ProxyStream.hls.attachMedia(video);

                ProxyStream.hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    video.play();
                    ProxyStream.initPlayerControls();

                    if (ProxyStream.hls.levels.length > 0) {
                        const container = $('#anti-ban-stream');
                        const qualityBtn = container.find('.anti-ban-quality-selector');
                        const qualityMenu = container.find('.anti-ban-quality-menu');

                        const maxLevel = ProxyStream.hls.levels.length - 1;
                        ProxyStream.hls.currentLevel = maxLevel;
                        ProxyStream.hls.nextLevel = maxLevel;
                        
                        qualityBtn.html(`${ProxyStream.qualities[0]} ▾`);
                        qualityMenu.find('.anti-ban-quality-option').first().addClass('active');
                    }
                });

                ProxyStream.hls.on(Hls.Events.ERROR, function (event, data) {
                    if (event && data) {
                        console.log('Twitch Anti-Ban:', event, data);
                    }
                });
            });
        } else {
            ProxyChat.log('Unable to initialize stream player. HLS is not supported in this browser.');
        }
    },
}