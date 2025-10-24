function postData(url, data, successCb, errorCb) {
  $.ajax({
    url: url,
    data: data,
    type: "POST",
    success: successCb,
    error: errorCb,
  });
}

function postFormData(url, formData, successCb, errorCb) {
  $.ajax({
    url: url,
    data: formData,
    processData: false,
    contentType: false,
    type: "POST",
    success: successCb,
    error: errorCb,
  });
}

function getData(url, successCb, errorCb) {
  $.ajax({
    url: url,
    type: "GET",
    dataType: "json",
    success: successCb,
    error: errorCb,
  });
}

function updateData(url, data, successCb, errorCb) {
  $.ajax({
    url: url,
    data: data,
    type: "PUT",
    success: successCb,
    error: errorCb,
  });
}

function getDataProxy(url, successCb, errorCb) {
  const proxy = "https://api.codetabs.com/v1/proxy?quest=";
  const proxiedUrl = proxy + encodeURIComponent(url);

  $.ajax({
    url: proxiedUrl,
    type: "GET",
    dataType: "json",
    success: successCb,
    error: errorCb,
  });
}
