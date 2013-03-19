function TransloaditUploader($el, opts) {
  this.$el = $el;

  if (!opts) {
    opts = {};
  }

  this.finishCb = opts.finishCb || function(response) {
    console.log('finished with response', response);
  };
  this.errorCb = opts.errorCb || function(error) {
    alert("There was an error uploading your file");
  };

  var params = opts.transloaditParams || {
    auth: {key: 'YOUR-AUTH-KEY'},
    template_id: 'YOUR TEMPLATE ID',
    notify_url: 'YOUR-NOTIFY-URL'
  };

  this.canDoDragAndDrop = Modernizr.draganddrop;
  try {
    new FormData();
  } catch(e) {
    this.canDoDragAndDrop = false;
  }

  this.paramsString = JSON.stringify(params);
  this.$el.find('input[name="params"]').attr('value', this.paramsString);

  this.bindEvents();
}

TransloaditUploader.prototype.bindEvents = function() {
  var self = this;
  this.$el.find('input[type=file]').on('change', function() {
    self.fileChangedCb(this);
  });

  if (this.canDoDragAndDrop) {
    var el = this.$el[0];

    el.addEventListener('dragenter', this.dragEnterCb.bind(this), false);
    el.addEventListener('dragexit', this.dragExitCb.bind(this), false);
    el.addEventListener('dragover', this.dragOverCb.bind(this), false);
    el.addEventListener('dragleave', this.dragExitCb.bind(this), false);
    el.addEventListener('drop', this.dropCb.bind(this), false);
  }
};

TransloaditUploader.prototype.startUpload = function(opts) {
  var options = {
    wait: true,
    modal: true,
    autoSubmit: false,
    onSuccess: this.successCb.bind(this),
    onError: this.errorCb
  };

  if (opts.formData) {
    options.formData = opts.formData;
  }

  this.$el.unbind('submit.transloadit');
  this.$el.transloadit(options);
  this.$el.submit();
};

TransloaditUploader.prototype.fileChangedCb = function(field) {
  var fileInput = this.$el.find('input[type=file]');
  this.initUpload(fileInput);
};

TransloaditUploader.prototype.initUpload = function(file) {
  var opts = {};
  if (this.canDoDragAndDrop === true && (file instanceof FormData)) {
    opts.formData = file;
  } else {
    opts.fileInput = file;
  }

  this.startUpload(opts);
};

TransloaditUploader.prototype.successCb = function(response) {
  if (response.ok == 'ASSEMBLY_COMPLETED') {
    return this.finishCb(response);
  }

  var self = this;
  setTimeout(function() {
    self.checkAssemblyUrl(response.assembly_url);
  }, 1000);
};


TransloaditUploader.prototype.checkAssemblyUrl = function(assemblyUrl) {
  $.getJSON(assembly_url, undefined, this.successCb, this.errorCb);
};

TransloaditUploader.prototype.dragEnterCb = function(e) {
  e.stopPropagation();
  e.preventDefault();
};

TransloaditUploader.prototype.dragExitCb = function(e) {
  this.$el.removeClass('hover');
  e.stopPropagation();
  e.preventDefault();
};

TransloaditUploader.prototype.dragOverCb = function(e) {
  this.$el.addClass('hover');
  e.stopPropagation();
  e.preventDefault();
};

TransloaditUploader.prototype.dropCb = function(e) {
  this.$el.removeClass('hover');
  e.stopPropagation();
  e.preventDefault();

  var files = e.dataTransfer.files;
  if (files.length === 0) {
    return;
  }

  var formdata = new FormData();
  for (var i in files) {
    if (typeof files[i] === 'object') {
      formdata.append("file", files[i]);
    }
  }
  this.initUpload(formdata);
};
