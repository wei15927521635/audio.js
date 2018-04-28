/// <reference path="jquery.all.js" />
(function (window, undefined) {
    "use strict";

    var makeArray = Q.makeArray,
        extend = Q.extend,
        fire = Q.fire,
        E = Q.event,
        createEle = Q.createEle,
        factory = Q.factory,
        view = Q.view,
        store = Q.store;

    var LANG = {
        play: "播放",
        pause: "暂停",
        progress: "进度",
        duration: "时长",
        volume: "音量",
        quiet:"静音",
        del: "删除",
        song_list: "歌单",
        prev_song: "上一曲",
        next_song: "下一曲",
        scan_song: "扫描音乐",
        close: "关闭"
    };

    //配置语言
    function setLang(langs) {
        extend(LANG, langs, true);
    }

    var music_data = [],
        music_data_map = {},
        music_default = [],
        data_map = {},
        my_index = 0,
        video_volume;

    function audio_player(init) {
        this.es_ = [];
        fire(init, this)
    }

    factory(audio_player).extend({
        fire: function () {
            fire(this.callback, this, this.data);
            return this;
        },
        draw: function (ops) {
            var self = this,
                box = self.box,
                data = ops.data;

            if (!data) return;

            var html =
                '<div class="abtn1 btnPaused" title="' + LANG.pause + '"></div>' +
                '<div class="abtn1 btnCurrentTime" title="' + LANG.progress + '"></div>' +
                '<div class="abtn1 btnName"><marquee scrollamount="2">' + data.name + '</marquee></div>' +
                '<div class="abtn1 btnDuration" title="' + LANG.duration + '"></div>' +
                '<audio id="my-audio" height="25" src="' + data.url + '" x="' + data.id + '">' +
                    '<source src="' + data.url + '" type="audio/mpeg">' +
                    '<source src="' + data.url + '" type="audio/ogg">' +
                    '<embed src="' + data.url + '">' +
                '</audio>';

            self.find('.content', box).html(html);

            var x = self.get('#my-audio');
            x.controls = true;
            x.autoplay = true,
            x.volume = video_volume !== undefined ? video_volume:0.5;

            return self;
        },
        _draw: function (ops) {
            var self = this,
                box = self.box,
                data1 = ops.data1,
                data2 = ops.data2;

            var html =
                '<ul>' +
                    (data1 || []).map(function (t, i) {
                        if (data2 && t.id == data2.id) my_index = i;
                        data_map[i] = t;
                        var row =
                            '<li x="' + i + '" class="' + (data2 && t.id == data2.id ? 'on' : '') + '">' +
                                '<a class="fl mark">' + (i + 1) + '、' + t.name + '</a>' +
                                '<span class="fr del" title="' + LANG.del + '">x</span>' +
                            '</li>';
                        return row;
                    }).join('') +
                '</ul>' +
                '<div class="audio-menu"></div>';

            self.find('.audio-text', box).html(html);
        },
        load: function (ops) {
            var self = this,
                box = self.box,
                ops = self.ops,
                data1 = ops.data1,
                data2 = ops.data2,
                only = ops.only;

            self.draw({ data: data2 });

            function timeout() {
                var x = self.get('#my-audio');
                if (!x) return;
                if (x.ended) {
                    // video_volume = x.volume;
                    my_index = parseInt(my_index) + 1;
                    if (my_index >= music_data.length) my_index = 0;
                    self.draw({ data: data_map[my_index] });
                    var el = self.find('li', box);
                    $(el).removeClass('on');
                    el[my_index].className = "on";
                }
                setTimeout(timeout, 1000);
            }

            timeout();

            function audio_tabs_btn() {
                var a = self.get('#my-audio');
                if (!a) return;
                var duration = Math.round(a.duration),
                    currentTime = Math.round(a.currentTime),

                    dp;
                    
                    if(video_volume !== undefined) a.volume = video_volume;
                   
                if (!isNaN(duration)) {
                    dp = Date.parts(duration);
                    self.find('.btnDuration').html(dp.minutes.format(2) + ':' + dp.seconds.format(2));
                    //self.find('.btnDuration').html(duration > 60 ? Math.floor(duration / 60) + ':' + (duration % 60 < 10 ? '0' + duration % 60 : duration % 60) : '0:' + (duration < 10 ? '0' + duration.toFixed(0) : duration.toFixed(0)));
                }

                if (!isNaN(currentTime)) {
                    dp = Date.parts(currentTime);
                    self.find('.btnCurrentTime').html(dp.minutes.format(2) + ':' + dp.seconds.format(2));
                    //self.find('.btnCurrentTime').html(currentTime > 60 ? Math.floor(currentTime / 60) + ':' + (currentTime % 60 < 10 ? '0' + currentTime % 60 : currentTime % 60) : '0:' + (currentTime < 10 ? '0' + currentTime.toFixed(0) : currentTime.toFixed(0)));
                }

                setTimeout(audio_tabs_btn, 1000);
            }

            audio_tabs_btn();

            return self;
        },
        find: function (parent, context) {
            return typeof parent == "string" ? $(parent, context || this.box) : makeArray(parent);
        },
        get: function (pattern, context) {
            return this.find(pattern, context)[0];
        },//获取事件回调函数
        getEventCallback: function (fn, data) {
            var self = this;

            if (fn == "hide") return function () { self.data = data; self.hide(); };
            if (fn == "remove") return function () { self.data = data; self.remove(); };

            return fn;
        },
        bind: function (types, selector, fn, data) {
            var self = this;
            self.es_.push(E.add(self.box, types, selector, self.getEventCallback(fn, data)));
        },
        hide: function () {
            var box = this.box;
            $(box).hide();
        },
        remove: function () {
            var box = this.box;
            $(box).remove();
        },
        on: function (types, selector, fn, data) {
            var self = this;
            self.es_.push(E.add(self.box, types, selector, self.getEventCallback(fn, data)));
            return self;
        }
    });

    function audio_box(ops) {
        ops = ops || {};
        var isPaly = false;
        if(music_data.length == 0) isPaly = true;
        var myAudio = document.getElementById('my-audio');

        return new audio_player(function () {
            var self = this,
                background = ops.background || $('#header').css('background-color'),//UI背景
                url = ops.url,//添加歌单数据,
                only = ops.only || false,//单曲循环
                data1 = ops.data1,//默认歌单
                ext = ['.mp3', '.ogg'],//支持播放格式
                Abox,
                index = 0;

            self.ops = ops;
            self.callback = ops.callback;

            data1.forEach(function (t, i) {
                if (!music_data_map[t.id]) music_data.push(t);
            });

            music_default = ops.data2;//默认播放
            music_data_map = music_data.toObjectMap('id');

            //如果播放器存在，就只添加歌单

            if (myAudio && !isPaly) return self._draw({ data1: music_data, data2: music_data_map[$(myAudio).attr('x')] });

            if ($('body').find('.audio-wrap')) $('body').find('.audio-wrap').remove();

            var html =
                '<div class="audio-mp3">' +
                    '<div class="c m song-name" title="' + LANG.song_list + '"><div class="ico"></div></div>' +
                    '<div class="c m prev" title="' + LANG.prev_song + '"><</div>' +
                    '<div class="c content"></div>' +
                    '<div class="c m next" title="' + LANG.next_song + '">></div>' +
                    '<div class="c m volume" title="' + LANG.volume + '">'+
                        '<div class="ico"></div>'+
                    '</div>' +
                    '<div class="c m x-close" title="' + LANG.close + '">X</div>' +
                    '<div class="volume-progress hide" title="'+LANG.volume+'">'+
                        '<div class="progress-warp">'+
                            '<div class="volume-btn"></div>'+
                        '</div>'+
                        '<span class="volume-num">0</span>'+
                    '</div>'+
                '</div>' +
                '<div class="audio-text"></div>' +
                '<style>' +
                    '.audio-wrap{position: absolute;z-index: 2;' + (view.getWidth() < 760 ? 'bottom:2px;margin-right:-185px;' : 'bottom:2px;') + 'right:' + (view.getWidth() < 760 ? '50%' : '5px') + ';width:310px;}' +
                    '.audio-mp3{width:310px;height:28px;position:relative;}' +
                    '.audio-mp3 .c{height:100%;float:left;line-height: 28px;}' +
                    '.audio-mp3 .content{width:150px;height:100%;background:' + background + ';overflow:hidden;}' +//
                    '.audio-mp3 .m{background: ' + background + ';color:#fff;cursor: pointer;text-align: center;width:30px;}' +
                    '.audio-mp3 .prev,.audio-mp3 .song-name{margin-right: 2px;}' +
                    '.audio-mp3 .x-close,.audio-mp3 .add,.audio-mp3 .next,.volume,.quiet{margin-left: 2px;}' +
                    '.audio-mp3 .song-name .ico,.volume .ico{width:20px;height:20px;margin:7px auto 0;}' +
                    '.audio-mp3 .song-name .ico{background-image:url(images/player.png);background-position:3px -195px;background-repeat:no-repeat;background-size:70px;}' +
                    '.audio-mp3 .volume .ico{background-image:url(images/player.png);background-position:3px -96.5px;background-repeat:no-repeat;background-size:90px;}'+
                    '.audio-mp3 .abtn1{float:left;width:24px;height:24px;color:#fff;margin-top:2px;margin-left:2px;line-height:24px;text-align:center;}' +
                    '.audio-mp3 .btnPlay{width:20px;height:20px;margin-top:3px;cursor:pointer;background-image:url(images/player.png);background-position:5px 4px;background-repeat:no-repeat;background-size:70px;}' +
                    '.audio-mp3 .btnPaused{width:20px;height:20px;margin-top:3px;cursor:pointer;background-image:url(images/player.png);background-position:-12px 5px;background-repeat:no-repeat;background-size:70px;}' +
                    '.audio-mp3 .btnName{width:60px;height:100%;}' +
                    '#my-audio{width:100%;height:28px;display:none;}' +//
                    '.audio-text{background: #fff;border:1px solid ' + background + ';padding:10px 3%;max-height:460px;overflow-y:scroll;position:absolute;bottom:28px;' + (view.getWidth() < 760 ? 'width:93.3%;' : 'width:93.2%;') + '}' +
                    '.audio-text li{padding:10px 0;border-bottom:1px solid #ccc;overflow:hidden;}' +
                    '.audio-text li a{white-space:nowrap;cursor: pointer;display: block;overflow:hidden;overflow-wrap: normal;text-overflow: ellipsis;word-break: keep-all;width:73%;}' +
                    '.audio-text li span{display:none;width:15px;height:15px;color:' + background + ';text-align:center;cursor:pointer;line-height:15px;border-radius:50%;border:1px solid ' + background + ';}' +
                    '.audio-text li:hover a{color:#0af;}' +
                    '.audio-text li:last-child{border:none;}' +
                    '.audio-text li.on a{color:#0af;}' +
                    '.volume-progress{cursor:pointer;width:100px;height:7px;position:absolute;z-index:88;top:-12px;right:40px;border-radius:15px;border:1px solid #ccc;}'+
                    '.progress-warp{width:100px;height:7px;}'+
                    '.volume-btn{height:7px;background:'+background+';border-radius:15px;width:0px;}'+
                    '.volume-num{position:absolute;left:-23px;top:-4px;}'+
                 '</style>';

            Abox = createEle('div', 'audio-wrap', html);

            Q.body.appendChild(Abox);

            self.box = Abox;
            self._draw({ data1: music_data, data2: music_default });
            self.load();
            self.bind('click', '.x-close',function(){
                music_data = [];
                music_data_map = {};
                self.remove();
            });

            self.on('click', '.song-name', function () {
                var audio_text = self.find('.audio-text', Abox);

                if (audio_text[0].className != "audio-text active") {
                    audio_text.addClass('active');
                    audio_text.hide();
                } else {
                    audio_text.removeClass('active');
                    audio_text.show();
                }

                return false;
            }).on('click', '.prev', function () {
                var el = self.find('li.on', Abox),
                    x = +$(el).attr('x');

                index = x - 1;
                if (!music_data[index]) index = music_data.length - 1;
                el[0].className = ' ';

                self.find('li', Abox)[index].className = "on";
                self.draw({ data: music_data[index] });

                my_index = index;

                return false;
            }).on('click', '.next', function () {
                var el = self.find('li.on', Abox),
                    x = +$(el).attr('x');

                index = x + 1;

                if (!music_data[index]) index = 0;
                el[0].className = ' ';

                self.find('li', Abox)[index].className = "on";
                self.draw({ data: music_data[index] });

                my_index = index;
                return false;
            }).on('click', 'li', function (e) {
                $(this).addClass('on').siblings().removeClass('on');
                var x = $(this).attr('x');

                my_index = x;

                self.draw({ data: music_data[x] })
                return false;
            }).on('contextmenu', '.audio-text', function (e) {

            }).on('mouseover', 'li', function (e) {
                $(this).find('span').show();

            }).on('mouseout', 'li', function (e) {
                $(this).find('span').hide();

            }).on('click', 'span.del', function () {
                var parent = this.parentNode,
                    x = $(parent).attr('x'),
                    a = self.get('#my-audio');

                music_data.splice(x, 1);
                music_data_map = music_data.toObjectMap('id');

                if (music_data.length == 0){
                     a.src = '';
                     self.find('marquee',Abox).html('请添加歌曲');
                }
                self._draw({ data1: music_data, data2: music_data_map[$(a).attr('x')] });

                return false;
            }).on('click', '.btnPlay', function () {
                $(this).attr('title', LANG.pause).removeClass('btnPlay').addClass('btnPaused');

                var a = document.getElementById('my-audio');
                a.play();

                return false;
            }).on('click', '.btnPaused', function () {
                $(this).attr('title', LANG.play).removeClass('btnPaused').addClass('btnPlay');

                var a = document.getElementById('my-audio');
                
                a.pause();

                return false;
            }).on('click','.volume',function(){
                var a = document.getElementById('my-audio'),
                    volume = a.volume*100,
                    progress = self.find('.volume-btn',Abox),
                    progress_warp = self.find('.volume-progress',Abox);
                progress_warp.hasClass('hide') ? progress_warp.removeClass('hide'):progress_warp.addClass('hide');
                $(progress).width(volume+'%');
                self.find('.volume-num',Abox).html(volume);  
                return false;
            }).on('click','.progress-warp',function(e){

                var clientX = e.clientX,//鼠标点击位置

                    volume = clientX - self.box.offsetLeft - this.parentNode.offsetLeft,

                    a = document.getElementById('my-audio');

                self.find('.volume-btn',Abox).width(volume+'px');

                self.find('.volume-num',Abox).html(volume); 

                a.volume = volume/100;

                video_volume =  volume/100;  

            })
        });
    }

    audio_box.setLang = setLang;

    Q.AudioPlayer = Q.audio_box = audio_box;
})(window);