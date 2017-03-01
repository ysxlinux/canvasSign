/*
* Summary: canvasSign.jquery
* Author: zcj
* version:1.0.1
* Date: 2016
* qq: 1450482096
*/
;(function($){

	var canvasSign = function(ele , config){

		this.ele = ele;
		this.context = this.ele.getContext('2d');

		this.isDown = false;
		this.lastLoc = {x:0,y:0};
		this.lastTime = 0;
		this.lastLineWidth = -1;
		this.img = null;
		this.isRetain = false;
		this.config = {
			width : 400,
			height: 200,
			lineWidth:5,
			minLineWidth: 1,
			maxV:10,
			maskIng: {
				isMask:false,
				maskText:'',
				maskLineHeight:40,
				maskFont:'bold 26px 微软雅黑',
				maskColor:'#fff'
			},
			lineColor: 'block',
			bgColor:'rgba(0,0,0,0)',
			bgImgSrc:null,
			bgRetain:false
		};

		if( config && $.isPlainObject(config) ){
			$.extend(true,this.config,config);
		}

		this._init();
		return this;
	};

	canvasSign.prototype = {
		clear:function(){
			var _t = this;
			this.isRetain = false;
			_t.context.clearRect(0,0,_t.config.width,_t.config.height);
			_t._fillBackgroundImg(function(){
				_t._fillMask();
			});
			return this;
		},
		getDataURL:function(){
			var dataURL = this.ele.toDataURL("image/png");
			return dataURL;
		},
		setLineColor:function(value){
			var color = value === undefined ? this.config.lineColor : value;
			this.config.lineColor = color;
			return this;
		},
		setLineWidth:function(value){
			var w = value === undefined ? parseInt(this.config.lineWidth) : parseInt(value);
			this.config.lineWidth = w;
			return this;
		},
		isMasking:function(cfg){
			$.extend(this.config.maskIng,cfg||{});
			return this;
		},
		_init:function(){
			var canvas = this.ele,
				_t = this;
			canvas.width = this.config.width;
			canvas.height = this.config.height;
			var isImg = this.config.bgImgSrc == null || this.config.bgImgSrc === '';
			if(!isImg){
				this.img == null? this.img=new Image():this.img;
				this.img.src= this.config.bgImgSrc;
			}
			this.clear();
			this._write();
		},
		_downStroke:function(point){
			
			this.isDown = true;
			if( !this.isRetain ){
				if(this.config.maskIng.isMask){
					this.config.maskIng.isMask = false;
				}
				if(!this.config.bgRetain){
					this.context.clearRect(0,0,this.config.width,this.config.height);
				}else{
					this.clear();
				}
				this.isRetain = true;
			}
			
			var loc = this._canvasIsWindow(point.x , point.y);
			this.lastLoc = loc;
			this.lastTime = new Date().getTime();
			//alert(point.x +' '+ point.y+' '+loc.x+' '+loc.y );
		},
		_endStroke:function(){
			this.isDown = false;
		},
		_moveStroke:function(point){
			var _t = this;
			var curLoc = _t._canvasIsWindow(point.x , point.y);
			var curTime = new Date().getTime();
			var t = curTime - _t.lastTime;
			var s = _t._calcDistance(curLoc , _t.lastLoc);

			var lineWidth = _t._calcLineWidth( t, s);

			_t.context.strokeStyle = _t.config.lineColor;
			_t.context.lineWidth = lineWidth;
			_t.context.lineCap = "round";
			_t.context.lineJoin = "round";

			_t.context.beginPath();
			_t.context.moveTo(_t.lastLoc.x , _t.lastLoc.y);
			_t.context.lineTo(curLoc.x , curLoc.y);
			_t.context.stroke();

			_t.lastLoc = curLoc;
			_t.lastTime = curTime;
			_t.lastLineWidth = lineWidth;
		},
		_write:function(){
			var _t = this,
					ele = this.ele;

			$(ele).on('mousedown' , function(e){
				_t._downStroke({x:e.clientX , y:e.clientY});
			});
			$(ele).on('mousemove' , function(e){
				e.preventDefault();
				if(_t.isDown){
					_t._moveStroke({x:e.clientX , y:e.clientY});
				}
			});
			$(ele).on('touchstart',function(e){
				e.preventDefault();
				var touch = e.originalEvent.targetTouches[0];
				_t._downStroke({x:touch.clientX , y:touch.clientY});
			});
			$(ele).on('touchend mouseup mouseout',function(e){
				_t._endStroke();
			});
			$(ele).on('touchmove',function(e){
				e.preventDefault();
				var touch = e.originalEvent.targetTouches[0];
				if(_t.isDown){
					_t._moveStroke({x:touch.clientX , y:touch.clientY});
				}
				
			});
		},
		_fillMask:function(){
			var ctt = this.context,
				cfg = this.config,
				  _t = this;
			if(cfg.maskIng.isMask){
				ctt.save();
				_t._fillMaskText();
				
				ctt.restore();
				
			}
		},
		_fillBackgroundImg:function(fn){
			var ctt = this.context,
				cfg = this.config,
				img = this.img;

			ctt.fillStyle = cfg.bgColor;
			ctt.fillRect(0,0,cfg.width,cfg.height);
			if( this.img != null ){
				if(img.complete){
					ctt.drawImage(img,0,0,cfg.width,cfg.height);
					fn();
					return false;
				}
				img.onload = function(){
					ctt.drawImage(img,0,0,cfg.width,cfg.height);
					fn();
				};
				img.onerror = function(){
					console.log('图片加载失败');
					fn();
				};
			}else{
				fn();
			}
		},
		_fillMaskText:function(){
			var ctt = this.context,
				cfg = this.config;
			ctt.font = cfg.maskIng.maskFont;
			ctt.textAlign = 'center';
			ctt.textBaseline="middle";
			ctt.fillStyle = cfg.maskIng.maskColor;
			var mText = cfg.maskIng.maskText.split('·');
			var lineHeight = cfg.maskIng.maskLineHeight;
			var sHeight = (cfg.height - (mText.length*lineHeight))/2+(lineHeight/2);
			for(var i=0; i<mText.length; i++){
				ctt.fillText(mText[i],cfg.width/2,sHeight+lineHeight*i );
			}
		},
		_canvasIsWindow:function(X,Y){
			var ele = this.ele, bbox;
			bbox = ele.getBoundingClientRect();
			
			return { x:Math.round(X-bbox.left) , y:Math.round(Y-bbox.top) };
		},
		_calcDistance:function(loc1,loc2){
			return Math.sqrt( (loc1.x - loc2.x)*(loc1.x - loc2.x) + (loc1.y - loc2.y)*(loc1.y - loc2.y) );
		},
		_calcLineWidth:function( t, s ){
			var _t = this;
			var v = s/t;
			var result;
			if( !isFinite(v) ) v=0.1;
			if( v<=0.1 ){
				result = _t.config.lineWidth;
			}else if( v>=_t.config.maxV ){
				result = _t.config.minLineWidth;
			}else{
				result = _t.config.lineWidth-(v-0.1)/(_t.config.maxV-0.1)*(_t.config.lineWidth-_t.config.minLineWidth);
			}

			if( _t.lastLineWidth == -1 ){
				return result;
			}

			return (_t.lastLineWidth*2/3) + (result*1/3);
		}
	};

	window.canvasSign = canvasSign;
	$.canvasSign = function(ele , config){
		return new canvasSign(ele , config);
	};

})(jQuery);

jQuery.fn.extend({
	canvasSign : function(options){
		return this.each(function(){
			var _t = $(this),
				dataSign = _t.data('canvasSign');
			if(!dataSign){
				dataSign = new canvasSign(_t[0],options);
				_t.data('canvasSign',dataSign);
			}
		});
	},
	clear : function(options){
		return this.each(function(){
			var _t = $(this),
				dataSign = _t.data('canvasSign');
			if(dataSign){
				dataSign.clear();
			}
		});
	},
	isMasking : function(options){
		return this.each(function(){
			var _t = $(this),
				dataSign = _t.data('canvasSign');
			if(dataSign){
				dataSign.isMasking(options);
			}
		});
	},
	setLineColor : function(options){
		return this.each(function(){
			var _t = $(this),
				dataSign = _t.data('canvasSign');
			if(dataSign){
				dataSign.setLineColor(options);
			}
		});
	},
	setLineWidth : function(options){
		return this.each(function(){
			var _t = $(this),
				dataSign = _t.data('canvasSign');
			if(dataSign){
				dataSign.setLineWidth(options);
			}
		});
	},
	getDataURL : function(value){
		var _t = $(this);
		return $.access( this, function() {
			var dataSign = _t.data('canvasSign');
			if(dataSign){
				var dataURL = dataSign.getDataURL();
				return dataURL;
			}
			return false;
		}, null, value, arguments.length );
	}
});