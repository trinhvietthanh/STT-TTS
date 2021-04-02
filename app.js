var query = (function (searchStr) {
  if (!searchStr) {
    return {};
  }
  searchStr = searchStr.substring(1);
  return searchStr.split("&").reduce(function (search, next) {
    var searchs = next.split("=", 2);
    if (searchs.length === 1) {
      search[searchs[0]] = searchs[0];
    } else {
      search[searchs[0]] = searchs[1];
    }
    return search;
  }, {});
})(document.location.search);

var numberItem = 0; // id for audioFile

var fromLang = query.from;

switch (fromLang) {
  case "ja":
    fromLang = "ja-JP";
    break;
  case "en":
    fromLang = "en-US";
    break;
  case "vi":
    fromLang = "vi-VN";
    break;
  default:
    fromLang = "ja-JP";
    break;
}

var asr = new ASREngine(fromLang);

var $iterRes = document.getElementsByClassName("inter-result")[0];
var $result = document.getElementsByClassName("recog-results")[0];
var $tranResult = document.getElementsByClassName("translate-results")[0];
var $startStopBtn = document.getElementsByClassName("start-stop-btn")[0];

asr.on("interim", function (res) {
  $iterRes.innerText = res.result;
});

asr.on("recognized", function (res) {
  $iterRes.innerText = "";

  var item = document.createElement("div"),
    text = document.createElement("p"),
    icon = document.createElement("img"),
    audioFile = document.createElement("audio");
  icon.src = "/Speaker.png";
  text.setAttribute("class", "col-sm-11 res-text");
  icon.setAttribute("class", "speaker-icon");
  icon.setAttribute("onclick", "play_speaker(" + numberItem + ");");
  icon.getAttribute("onclick");

  // if onclick is not a function, it's not IE7, so use setAttribute
  if (typeof onclick != "function") {
    icon.setAttribute("onclick", "play_speaker(" + numberItem + ");" + onclick); // for FF,IE8,Chrome

    // if onclick is a function, use the IE7 method and call onclick() in the anonymous function
  } else {
    icon.onclick = function () {
      play_speaker(numberItem);
      onclick();
    }; // for IE7
  }
  item.setAttribute("class", "res-item");
  audioFile.setAttribute("class", "audio-file");
  audioFile.setAttribute("id", numberItem);
  if (query.from != null) {
    audioFile.src = text_to_speech(res.result, query.from);
  } else {
    audioFile.src = text_to_speech(res.result, "ja");
  }
	
  audioFile.load();
  numberItem++;
  text.innerText = res.result;
  item.append(text, icon, audioFile);
	audioFile.onloadstart = function () {
  $result.append(item);
	}

  translate(res.result).then(function (trans) {
    var item = document.createElement("div"),
      text = document.createElement("p"),
      icon = document.createElement("img"),
      audioFile = document.createElement("audio");
    icon.src = "/Speaker.png";
    text.setAttribute("class", "col-lg-11 res-text");
    icon.setAttribute("class", "speaker-icon");
    icon.setAttribute("onclick", "play_speaker(" + numberItem + ");");
    icon.getAttribute("onclick");
    // if onclick is not a function, it's not IE7, so use setAttribute
    // if onclick is not a function, it's not IE7, so use setAttribute
    if (typeof onclick != "function") {
      icon.setAttribute(
        "onclick",
        "play_speaker(" + numberItem + ");" + onclick
      ); // for FF,IE8,Chrome

      // if onclick is a function, use the IE7 method and call onclick() in the anonymous function
    } else {
      icon.onclick = function () {
        play_speaker(numberItem);
        onclick();
      }; // for IE7
    }
    item.setAttribute("class", "res-item");
    audioFile.setAttribute("class", "audio-file");
    audioFile.setAttribute("id", numberItem);
    audioFile.src = text_to_speech(trans, "en");
    audioFile.load();
    numberItem++;
    text.innerText = trans;
    item.append(text, icon, audioFile);
    $tranResult.appendChild(item);
  });
});

asr.on("end", function () {
  started = false;
  showUI();
});

var started = false;

function play_speaker(id) {
  var audio = document.getElementById(id);
  audio.play();
}


/** function change language form to **/
function ChangeLang() {
	asr.stop().finally(function () {
		started = false;
		showUI();
	});
	query.from = $("select[name=fromLang] option").filter(":selected").val();
  query.to = $("select[name=toLang] option").filter(":selected").val();
  fromLang = query.from;
  switch (fromLang) {
    case "ja":
      fromLang = "ja-JP";
      break;
    case "en":
      fromLang = "en-US";
      break;
    case "vi":
      fromLang = "vi-VN";
      break;
    default:
      fromLang = "ja-JP";
      break;
  }

  var translate = (function (fromLang, toLang) {
		var jobQueue = [];
		var working = false;
	
		function trans(text) {
			var searchParams = new URLSearchParams();
			searchParams.set("src", text);
			searchParams.set("sl", fromLang);
			searchParams.set("tl", toLang);
	
			return new Promise(function (resolve, reject) {
				var url =
					"https://?" +
					searchParams.toString();
				$.ajax({
					url: url,
					method: "GET",
					dataType: "json",
					success: function (res) {
						resolve(res.trg);
					},
					error: function (e) {
						reject(e);
					},
				});
			});
		}
	
		function tryDrain() {
			if (working) {
				return;
			}
			if (jobQueue.length === 0) {
				return;
			}
			working = true;
			var job = jobQueue.splice(0, 1)[0];
			trans(job.text)
				.then(job.resolve, job.reject)
				.finally(function () {
					working = false;
					tryDrain();
				});
		}
		return function translate(text) {
			var pm = new Promise(function (resolve, reject) {
				jobQueue.push({
					text: text,
					resolve: resolve,
					reject: reject,
				});
				tryDrain();
			});
			return pm;
		};
	})(query.from || "ja", query.to || "en")

 asr = new ASREngine(fromLang);
 asr.on("interim", function (res) {
  $iterRes.innerText = res.result;
});
asr.on("recognized", function (res) {
  $iterRes.innerText = "";

  var item = document.createElement("div"),
    text = document.createElement("p"),
    icon = document.createElement("img"),
    audioFile = document.createElement("audio");
  icon.src = "/Speaker.png";
  text.setAttribute("class", "col-sm-11 res-text");
  icon.setAttribute("class", "speaker-icon");
  icon.setAttribute("onclick", "play_speaker(" + numberItem + ");");
  icon.getAttribute("onclick");

  // if onclick is not a function, it's not IE7, so use setAttribute
  if (typeof onclick != "function") {
    icon.setAttribute("onclick", "play_speaker(" + numberItem + ");" + onclick); // for FF,IE8,Chrome

    // if onclick is a function, use the IE7 method and call onclick() in the anonymous function
  } else {
    icon.onclick = function () {
      play_speaker(numberItem);
      onclick();
    }; // for IE7
  }
  item.setAttribute("class", "res-item");
  audioFile.setAttribute("class", "audio-file");
  audioFile.setAttribute("id", numberItem);
  if (query.from != null) {
    audioFile.src = text_to_speech(res.result, query.from);
  } else {
    audioFile.src = text_to_speech(res.result, "ja");
  }

  audioFile.load();
  numberItem++;
  text.innerText = res.result;
  item.append(text, icon, audioFile);
  $result.append(item);

  translate(res.result).then(function (trans) {
    var item = document.createElement("div"),
      text = document.createElement("p"),
      icon = document.createElement("img"),
      audioFile = document.createElement("audio");
    icon.src = "/Speaker.png";
    text.setAttribute("class", "col-lg-11 res-text");
    icon.setAttribute("class", "speaker-icon");
    icon.setAttribute("onclick", "play_speaker(" + numberItem + ");");
    icon.getAttribute("onclick");
    // if onclick is not a function, it's not IE7, so use setAttribute
    // if onclick is not a function, it's not IE7, so use setAttribute
    if (typeof onclick != "function") {
      icon.setAttribute(
        "onclick",
        "play_speaker(" + numberItem + ");" + onclick
      ); // for FF,IE8,Chrome

      // if onclick is a function, use the IE7 method and call onclick() in the anonymous function
    } else {
      icon.onclick = function () {
        play_speaker(numberItem);
        onclick();
      }; // for IE7
    }
    item.setAttribute("class", "res-item");
    audioFile.setAttribute("class", "audio-file");
    audioFile.setAttribute("id", numberItem);
    audioFile.src = text_to_speech(trans, query.to);
    audioFile.load();
    numberItem++;
    text.innerText = trans;
    item.append(text, icon, audioFile);
    $tranResult.appendChild(item);
  });
});

asr.on("end", function () {
  started = false;
  showUI();
});
	
}

function showUI() {
  if (started) {
    $startStopBtn.innerText = "Listening...";
    $($startStopBtn).removeClass("btn-primary").addClass("btn-danger");
  } else {
    $startStopBtn.innerText = "Start listen";
    $($startStopBtn).removeClass("btn-danger").addClass("btn-primary");
  }
}

$startStopBtn.onclick = function () {
  if (started) {
    asr.stop().finally(function () {
      started = false;
      showUI();
    });
  } else {
    // $result.innerHTML = '';
    asr.start().then(function () {
      started = true;
      showUI();
    });
  }
};

function queryStringify(object) {
  return Object.keys(object)
    .map(function (key) {
      var value = object[key];
      if (value === null || value === undefined) {
        return "";
      }
      return encodeURIComponent(key) + "=" + encodeURIComponent(value);
    })
    .join("&");
}

function text_to_speech(text, lang) {
  var url = "https://trial.demo01s/";
  url =
    url +
    "?" +
    queryStringify({
      text: text,
      lang: lang,
    });
  return url;
}

var translate = (function (fromLang, toLang) {
  var jobQueue = [];
  var working = false;

  function trans(text) {
    var searchParams = new URLSearchParams();
    searchParams.set("src", text);
    searchParams.set("sl", fromLang);
    searchParams.set("tl", toLang);

    return new Promise(function (resolve, reject) {
      var url =
        "https:/emo01/" +
        searchParams.toString();
      $.ajax({
        url: url,
        method: "GET",
        dataType: "json",
        success: function (res) {
          resolve(res.trg);
        },
        error: function (e) {
          reject(e);
        },
      });
    });
  }

  function tryDrain() {
    if (working) {
      return;
    }
    if (jobQueue.length === 0) {
      return;
    }
    working = true;
    var job = jobQueue.splice(0, 1)[0];
    trans(job.text)
      .then(job.resolve, job.reject)
      .finally(function () {
        working = false;
        tryDrain();
      });
  }
  return function translate(text) {
    var pm = new Promise(function (resolve, reject) {
      jobQueue.push({
        text: text,
        resolve: resolve,
        reject: reject,
      });
      tryDrain();
    });
    return pm;
  };
})(query.from || "ja", query.to || "en")
showUI();
