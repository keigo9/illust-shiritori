var w = $('.wrapper').width();
var h = $('.wrapper').height();
$('canvas').attr('width', w);
$('canvas').attr('height', h);

$(function () {
  var offset = 5;
  var fromX;
  var fromY;
  var drawFlag = false;
  var context = $("canvas").get(0).getContext('2d');
  var socket = io.connect('https://shiritori.dev/');
  context.lineWidth = 5;
  const STACK_MAX_SIZE = 20;
  // スタックデータ保存用の配列
  let undoDataStack = [];
  let redoDataStack = [];
  // imageList
  let imageTitle;
  let imageTitles = [];
  let imagePictures = [];

  // サーバからメッセージ受信
  socket.on('send user', function (msg) {
    context.strokeStyle = msg.color;
    context.lineWidth = msg.Number;
    // context.beginPath();
    // context.moveTo(msg.fx, msg.fy);
    context.lineTo(msg.tx, msg.ty);
    context.stroke();
    // context.closePath();
  });

  socket.on('mousedown user', function (msg) {
    beforeDraw();
    context.beginPath();
    context.moveTo(msg.fx, msg.fy);
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

  $('canvas').mousedown(function (e) {
    drawFlag = true;
    beforeDraw();
    fromX = e.pageX - $(this).offset().left - offset;
    fromY = e.pageY - $(this).offset().top - offset;
    context.beginPath();
    context.moveTo(fromX, fromY);
    socket.emit('mousedown send', { fx: fromX, fy: fromY });
    return false;  // for chrome
  });

  $('canvas').mousemove(function (e) {
    if (drawFlag) {
      draw(e);
    }
  });

  $('canvas').on('mouseup', function () {
    drawFlag = false;
    context.closePath();
  });

  $('canvas').on('mouseleave', function () {
    drawFlag = false;
    context.closePath();
  });

  $('.color').click(function () {
    context.strokeStyle = $(this).css('background-color');
  });

  $('#size').click(function () {
    context.lineWidth = Number($(this).val());
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
  }

  function draw(e) {
    var toX = e.pageX - $('canvas').offset().left - offset;
    var toY = e.pageY - $('canvas').offset().top - offset;
    // context.lineWidth = 5;
    // context.beginPath();
    // context.moveTo(fromX, fromY);
    context.lineTo(toX, toY);
    context.stroke();
    // context.closePath();

    // サーバへメッセージ送信
    socket.emit('server send', { fx: fromX, fy: fromY, tx: toX, ty: toY, color: context.strokeStyle, Number: context.lineWidth });
    fromX = toX;
    fromY = toY;
  }

  $('#save').click(function () {
    var d = $("canvas")[0].toDataURL("image/png");
    d = d.replace("image/png", "image/octet-stream");
    window.open(d, "save");
  });

  function sendImagePicture() {
    var d = $("canvas")[0].toDataURL("image/png");
    imagePictures.push(d);
    context.clearRect(0, 0, $('canvas').width(), $('canvas').height());
    // pushした配列が毎回レンダーされるので、そのたびに空にする。
    $('#imageListPicture').empty();
    $.each(imagePictures,
      function (index, elem) {
        $('<img>')
          .attr("src", elem)
          .appendTo("#imageListPicture");
      }
    );
  };

  function sendImageTitle(data) {
    //　入力欄をリセット
    $('form')[0].reset();
    //  取得したデーターを変数に入れる
    $.each(data, function (key, value) {
      imageTitle = value;
    });
    // 配列にpushする
    imageTitles.push(imageTitle);
    // console.log(imageTitles);
    // pushした配列が毎回レンダーされるので、そのたびに空にする。
    $('#imageListTitle').empty();
    $.each(imageTitles,
      function (index, elem) {
        // if (elem.title >= 40) { return false; }
        $('<li></li>')
          .append(elem.title)
          .appendTo('#imageListTitle');
      }
    );
  };

  $("#send-btn").click(function () {
    // form空文字リターン
    if ($('#shiritori').val() == "") {
      alert("絵の名前を書いてください");
      return false;
    } else {
      $.ajax({
        url: "https://shiritori.dev/posts/create",
        type: "POST",
        data: $('form').serialize(),
        dataType: "json",
        timespan: 1000
      }).done(function (data) {
        sendImageTitle(data);
        sendImagePicture()

        // 6. failは、通信に失敗した時に実行される
      }).fail(function (jqXHR, textStatus, errorThrown) {
        // $("#span1").text(jqXHR.status); //例：404
        // $("#span2").text(textStatus); //例：error
        // $("#span3").text(errorThrown); //例：NOT FOUND
        console.log(errorThrown)
      })
    }
  });
});