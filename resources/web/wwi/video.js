/* global SystemInfo */

'use strict';

class Video { // eslint-disable-line no-unused-vars
  constructor(view, parentObject, contextMenu) {
    this.view = view;
    this.domElement = document.createElement('img');
    this.domElement.style.background = 'white';
    this.domElement.id = 'remoteVideo';
    this.domElement.setAttribute('draggable', false);
    parentObject.appendChild(this.domElement);
    this.mouseDown = 0;
    this.onmousemove = (e) => { this._onMouseMove(e); };
    this.lastMousePosition = null;
    this.contextMenu = contextMenu;
    this.robotWindows = [];
    this.worldInfo = {title: null, infoWindow: null};
  }

  disconnect() {
    this.domElement.src = '';
  }

  finalize(onready) {
    this.domElement.addEventListener('mousedown', (e) => { this._onMouseDown(e); }, false);
    this.domElement.addEventListener('mouseup', (e) => { this._onMouseUp(e); }, false);
    this.domElement.addEventListener('wheel', (e) => { this._onWheel(e); }, false);
    this.domElement.addEventListener('contextmenu', (e) => { this._onContextMenu(e); }, false);
    if (typeof onready === 'function')
      onready();
  }

  setWorldInfo(title, infoWindowName) {
    this.worldInfo = {title: title, infoWindow: infoWindowName};
  }

  setRobotWindow(robotName, windowName) {
    this.robotWindows.push([robotName, windowName]);
  }

  setFollowed(solidId, mode) {
    var socket = this.view.stream.socket;
    if (!socket || socket.readyState !== 1)
      return;
    socket.send('follow: ' + mode + ',' + solidId);
  }

  showContextMenu(object) {
    this.contextMenu.show(object, this.lastMousePosition);
  }

  sendMouseEvent(type, event, wheel) {
    this.contextMenu.hide();
    var socket = this.view.stream.socket;
    if (!socket || socket.readyState !== 1)
      return;
    var modifier = (event.shiftKey ? 1 : 0) + (event.ctrlKey ? 2 : 0) + (event.altKey ? 4 : 0);
    socket.send('mouse ' + type + ' ' + event.button + ' ' + this.mouseDown + ' ' +
                event.offsetX + ' ' + event.offsetY + ' ' + modifier + ' ' + wheel);
    this.lastMousePosition = {x: event.offsetX, y: event.offsetY};
  }

  requestNewSize(width, height) {
    this.view.stream.socket.send('resize: ' + this.domElement.width + 'x' + this.domElement.height);
  }

  resize(width, height) {
    this.domElement.width = width;
    this.domElement.height = height;
    this.view.stream.socket.send('resize: ' + width + 'x' + height);
  }

  _onMouseDown(event) {
    this.mouseDown = 0;
    switch (event.button) {
      case 0: // MOUSE.LEFT
        this.mouseDown |= 1;
        break;
      case 1: // MOUSE.MIDDLE
        this.mouseDown |= 4;
        break;
      case 2: // MOUSE.RIGHT
        this.mouseDown |= 2;
        break;
    }
    if (SystemInfo.isMacOS() && 'ctrlKey' in event && event['ctrlKey'] && this.mouseDown === 1)
      // On macOS, "Ctrl + left click" should be dealt as a right click.
      this.mouseDown = 2;

    event.target.addEventListener('mousemove', this.onmousemove, false);
    this.sendMouseEvent(-1, event, 0);
    event.preventDefault();
    return false;
  }

  _onMouseMove(event) {
    if (this.mouseDown === 0) {
      event.target.removeEventListener('mousemove', this.onmousemove, false);
      return false;
    }
    this.sendMouseEvent(0, event, 0);
    return false;
  }

  _onMouseUp(event) {
    event.target.removeEventListener('mousemove', this.onmousemove, false);
    this.sendMouseEvent(1, event, 0);
    event.preventDefault();
    return false;
  }

  _onWheel(event) {
    this.sendMouseEvent(2, event, Math.sign(event.deltaY));
    return false;
  }

  _onContextMenu(event) {
    event.preventDefault();
    return false;
  }
}
