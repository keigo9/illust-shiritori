console.log("hjello")
var w = $('.wrapper').width();
var h = $('.wrapper').height();
$('canvas').attr('width', w);
$('canvas').attr('height', h);
var canvas_magnification = 15;    // ドット表示倍率
var writeMode = "normal";

$(function () {
  var offset = 5;
  var fromX;
  var fromY;
  var drawFlag = false;
  var context = $("canvas").get(0).getContext('2d');
  var socketURL = 'https://illust-shiritori.vercel.app/'
  //var socket = io.connect('https://desolate-ocean-87379.herokuapp.com/');
  // var socket = io.connect('http://localhost:3000/');
  var socket = io.connect(socketURL);
  context.lineWidth = 5;
  const STACK_MAX_SIZE = 20;
  // スタックデータ保存用の配列
  let undoDataStack = [];
  let redoDataStack = [];
  // imageList
  let imageTitle;
  let imageTitles = [];
  let imagePictures = [];
  // ひらがな判定正規表現
  var regexp = /^[\u{3000}-\u{301C}\u{3041}-\u{3093}\u{309B}-\u{309E}]+$/mu;
  let chars = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろ';
  let rand_str = '';

  // サーバからメッセージ受信
  socket.on('send user', function (msg) {
    context.strokeStyle = msg.color;
    context.lineWidth = msg.bold;
    context.fillStyle = msg.color;
    // context.beginPath();
    // context.moveTo(msg.fx, msg.fy);
    if (msg.writeMode === "normal") {
      context.lineTo(msg.tx, msg.ty);
    } else {
      context.fillRect(msg.col * msg.dotSize, msg.row * msg.dotSize, msg.dotSize, msg.dotSize);
    }
    context.stroke();
    // context.closePath();
  });

  socket.on('mousedown user', function (msg) {
    beforeDraw();
    context.beginPath();
    context.moveTo(msg.fx, msg.fy);
    if (msg.writeMode === "dot") {
      context.fillStyle = msg.color;
      context.fillRect(msg.col * msg.dotSize, msg.row * msg.dotSize, msg.dotSize, msg.dotSize);
    }
  });

  socket.on('prev user', function () {
    // 戻す配列にスタックしているデータがなければ処理を終了する
    if (undoDataStack.length <= 0) return;
    // やり直し用の配列に元に戻す操作をする前のCanvasの状態をスタックしておく
    redoDataStack.unshift(context.getImageData(0, 0, $('canvas').width(), $('canvas').height()));
    // 元に戻す配列の先頭からイメージデータを取得して
    var imageData = undoDataStack.shift();
    // 描画する
    context.putImageData(imageData, 0, 0);
  });

  socket.on('next user', function () {
    // やり直し用配列にスタックしているデータがなければ処理を終了する
    if (redoDataStack.length <= 0) return;
    // 元に戻す用の配列にやり直し操作をする前のCanvasの状態をスタックしておく
    undoDataStack.unshift(context.getImageData(0, 0, $('canvas').width(), $('canvas').height()));
    // やり直す配列の先頭からイメージデータを取得して
    var imageData = redoDataStack.shift();
    // 描画する
    context.putImageData(imageData, 0, 0);
  });

  socket.on('clear user', function () {
    context.clearRect(0, 0, $('canvas').width(), $('canvas').height());
  });

  socket.on('sendImagePicture user', function () {
    var d = $("canvas")[0].toDataURL("image/png");
    imagePictures.push(d);
    context.clearRect(0, 0, $('canvas').width(), $('canvas').height());
    // pushした配列が毎回レンダーされるので、そのたびに空にする。
    $('#imageListPicture').empty();
    $.each(imagePictures,
      function (index, elem) {
        $('<img>')
          .attr("src", elem)
          .after('<span class="after">→</span>')
          .appendTo("#imageListPicture");
      }
    );
  })

  socket.on('sendImageTitle user', function (msg) {
    //  取得したデーターを変数に入れる
    $.each(msg.data, function (key, value) {
      imageTitle = value;
    });
    // 配列にpushする
    imageTitles.push(imageTitle);
    // pushした配列が毎回レンダーされるので、そのたびに空にする。
    // $('#imageListTitle').empty();
    // $.each(imageTitles,
    //   function (index, elem) {
    //     $('<li></li>')
    //       .append(elem.title)
    //       .appendTo('#imageListTitle');
    //   }
    // );
  });

  socket.on('sendRenderImageTitle user', function () {
    $.each(imageTitles,
      function (index, elem) {
        $('<li></li>')
          .append(elem.title)
          .appendTo('#imageListTitle');
      }
    );
  })

  socket.on('startString user', function (msg) {
    rand_str = msg.rand_str;
    document.getElementById('start-string').innerHTML = `最初の文字は: ${rand_str}`;
  });

  $('canvas').mousedown(function (e) {
    drawFlag = true;
    beforeDraw();
    fromX = e.pageX - $(this).offset().left - offset;
    fromY = e.pageY - $(this).offset().top - offset;
    var col = Math.floor(fromX / canvas_magnification); //dot
    var row = Math.floor(fromY / canvas_magnification); //dot
    context.beginPath();
    context.moveTo(fromX, fromY);
    if (writeMode === "dot") {
      context.fillRect(col * canvas_magnification, row * canvas_magnification, canvas_magnification, canvas_magnification); //dot
    }
    socket.emit('mousedown send', { fx: fromX, fy: fromY, writeMode: writeMode, dotSize: canvas_magnification, col: col, row: row, color: color });
    return false;  // for chrome
  });

  document.addEventListener("touchmove", function (e) {
    drawFlag = true;
    beforeDraw();
    fromX = e.pageX - $(this).offset().left - offset;
    fromY = e.pageY - $(this).offset().top - offset;
    var col = Math.floor(fromX / canvas_magnification); //dot
    var row = Math.floor(fromY / canvas_magnification); //dot
    context.beginPath();
    context.moveTo(fromX, fromY);
    if (writeMode === "dot") {
      context.fillRect(col * canvas_magnification, row * canvas_magnification, canvas_magnification, canvas_magnification); //dot
    }
    socket.emit('mousedown send', { fx: fromX, fy: fromY, writeMode: writeMode, dotSize: canvas_magnification, col: col, row: row, color: color });
    return false;  // for chrome
  });

  $('canvas').mousemove(function (e) {
    if (drawFlag) {
      draw(e);
    }
  });

  document.addEventListener("touchmove", function (e) {
    if (drawFlag) {
      draw(e);
    }
  });

  $('canvas').on('mouseup', function () {
    drawFlag = false;
    context.closePath();
  });

  document.addEventListener("touchend", function (e) {
    if (drawFlag) {
      draw(e);
    }
  });

  $('canvas').on('mouseleave', function () {
    drawFlag = false;
    context.closePath();
  });

  $('#color').change(function () {
    // context.strokeStyle = $(this).css('background-color');
    color = $(this).val();
    context.strokeStyle = color;
    context.fillStyle = color;
  });

  $('#bold').click(function () {
    bold = Number($(this).val());
    context.lineWidth = bold;
    canvas_magnification = bold;
  });

  $('#prev').click(function () {
    // 戻す配列にスタックしているデータがなければ処理を終了する
    if (undoDataStack.length <= 0) return;
    // やり直し用の配列に元に戻す操作をする前のCanvasの状態をスタックしておく
    redoDataStack.unshift(context.getImageData(0, 0, $('canvas').width(), $('canvas').height()));
    // 元に戻す配列の先頭からイメージデータを取得して
    var imageData = undoDataStack.shift();
    // 描画する
    context.putImageData(imageData, 0, 0);
    socket.emit('prev send');
  });

  $('#next').click(function () {
    // やり直し用配列にスタックしているデータがなければ処理を終了する
    if (redoDataStack.length <= 0) return;
    // 元に戻す用の配列にやり直し操作をする前のCanvasの状態をスタックしておく
    undoDataStack.unshift(context.getImageData(0, 0, $('canvas').width(), $('canvas').height()));
    // やり直す配列の先頭からイメージデータを取得して
    var imageData = redoDataStack.shift();
    // 描画する
    context.putImageData(imageData, 0, 0);
    socket.emit('next send');
  });

  $('#clear').click(function (e) {
    socket.emit('clear send');
    e.preventDefault();
    context.clearRect(0, 0, $('canvas').width(), $('canvas').height());
  });

  function beforeDraw() {
    // やり直し用スタックの中身を削除
    redoDataStack = [];
    // 元に戻す用の配列が最大保持数より大きくなっているかどうか
    if (undoDataStack.length >= STACK_MAX_SIZE) {
      // 条件に該当する場合末尾の要素を削除
      undoDataStack.pop();
    }
    // 元に戻す配列の先頭にcontextのImageDataを保持する
    undoDataStack.unshift(context.getImageData(0, 0, $('canvas').width(), $('canvas').height()));
  };

  function draw(e) {
    var toX = e.pageX - $('canvas').offset().left - offset;
    var toY = e.pageY - $('canvas').offset().top - offset;
    var col = Math.floor(toX / canvas_magnification);
    var row = Math.floor(toY / canvas_magnification);
    // context.lineWidth = 5;
    // context.beginPath();
    // context.moveTo(fromX, fromY);
    if (writeMode === "normal") {
      context.lineTo(toX, toY);
    } else {
      context.fillRect(col * canvas_magnification, row * canvas_magnification, canvas_magnification, canvas_magnification);
    }
    context.stroke();
    // context.closePath();
    // サーバへメッセージ送信
    socket.emit('server send', { fx: fromX, fy: fromY, tx: toX, ty: toY, color: color, bold: bold, writeMode: writeMode, dotSize: canvas_magnification, col: col, row: row });
    fromX = toX;
    fromY = toY;
  };

  $('#save').click(function () {
    var d = $("canvas")[0].toDataURL("image/png");
    d = d.replace("image/png", "image/octet-stream");
    window.open(d, "save");
  });

  $('[name=write-mode]').click(function () {
    writeMode = $('input[name=write-mode]:checked').val();
  });

  function sendImagePicture() {
    socket.emit('sendImagePicture send');
    var d = $("canvas")[0].toDataURL("image/png");
    imagePictures.push(d);
    context.clearRect(0, 0, $('canvas').width(), $('canvas').height());
    // pushした配列が毎回レンダーされるので、そのたびに空にする。
    $('#imageListPicture').empty();
    $.each(imagePictures,
      function (index, elem) {
        $('<img>')
          .attr("src", elem)
          .after('<span class="after">→</span>')
          .appendTo("#imageListPicture");
      }
    );
  };

  function sendImageTitle(data) {
    //　入力欄をリセット
    $('form')[0].reset();
    // サーバへ送信
    socket.emit('sendImageTitle send', { data });

    //  取得したデーターを変数に入れる
    $.each(data, function (key, value) {
      imageTitle = value;
    });

    // 配列にpushする
    imageTitles.push(imageTitle);

    // pushした配列が毎回レンダーされるので、そのたびに空にする。
    // $('#imageListTitle').empty();
    // $.each(imageTitles,
    //   function (index, elem) {
    //     $('<li></li>')
    //       .append(elem.title)
    //       .appendTo('#imageListTitle');
    //   }
    // );

    isShiritori(imageTitles);
  };

  function isShiritori(imageTitles) {
    // 1回目はprevの値がないので、ランダム文字列と比較
    if (imageTitles[imageTitles.length - 2]) {
      var prevLastLetter = imageTitles[imageTitles.length - 2].title.slice(-1);
    } else {
      var prevLastLetter = rand_str;
    }
    var nextFirstLetter = imageTitles[imageTitles.length - 1].title.slice(0, 1);
    var nextLastLetter = imageTitles[imageTitles.length - 1].title.slice(-1);
    // console.log(prevLastLetter);
    // console.log(nextFirstLetter);
    // console.log(nextLastLetter);
    if (nextLastLetter == "ん") {
      alert("あなたの負けです");
      $.each(imageTitles,
        function (index, elem) {
          $('<li></li>')
            .append(elem.title)
            .appendTo('#imageListTitle');
        }
      );
      socket.emit('sendRenderImageTitle send');
    } else if (prevLastLetter != nextFirstLetter) {
      alert("あなたの負けです");
      $.each(imageTitles,
        function (index, elem) {
          $('<li></li>')
            .append(elem.title)
            .appendTo('#imageListTitle');
        }
      );
      socket.emit('sendRenderImageTitle send');
    }
  };

  $("#get-string").click(function getRandomStringJa() {
    if (imageTitles[0]) {
      return false;
    } else {
      rand_str = chars.charAt(Math.floor(Math.random() * chars.length));
      document.getElementById('start-string').innerHTML = `最初の文字は: ${rand_str}`;
      socket.emit('startString send', { rand_str });
    }
  });

  $("#send-btn").click(function () {
    var value = $('#shiritori').val();
    // form空文字リターン
    if (value == "") {
      alert("絵の名前を書いてください");
      return false;
      // ひらがなじゃなければリターン
    } else if (!regexp.test(value)) {
      alert("ひらがなで入力してください");
      return false;
    } else {
      $.ajax({
        url: `${socketURL}posts/create`,
        type: "POST",
        data: $('form').serialize(),
        dataType: "json",
        timespan: 1000
      }).done(function (data) {
        sendImageTitle(data);
        sendImagePicture();

        // 6. failは、通信に失敗した時に実行される
      }).fail(function (jqXHR, textStatus, errorThrown) {
        // $("#span1").text(jqXHR.status); //例：404
        // $("#span2").text(textStatus); //例：error
        // $("#span3").text(errorThrown); //例：NOT FOUND
        console.log(errorThrown)
      })
    }
  });

  $("#shiritori").keydown(function () {
    if (event.keyCode == 13) {
      event.preventDefault();
      $("#send-btn").click();
    }
  });
});