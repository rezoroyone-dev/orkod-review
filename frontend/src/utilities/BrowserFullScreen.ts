interface FsDocument extends HTMLDocument {
    webkitFullscreenElement: Element | undefined;
    webkitExitFullscreen: any;
    mozFullScreenElement?: Element;
    msFullscreenElement?: Element;
    msExitFullscreen?: () => void;
    mozCancelFullScreen?: () => void;
  }

  interface FsDocumentElement extends HTMLElement {
    webkitRequestFullscreen: any;
    msRequestFullscreen?: () => void;
    mozRequestFullScreen?: () => void;
  }

export default class BrowserFullScreen {
    
    public static  isFullScreen(document:Document): boolean {
    const fsDoc = <FsDocument> document;
  
    return !!(fsDoc.fullscreenElement || fsDoc.mozFullScreenElement || fsDoc.webkitFullscreenElement || fsDoc.msFullscreenElement);
  }
   
  public static  toggleFullScreen(document:Document): void {
    const fsDoc = <FsDocument> document;
  
    if (!BrowserFullScreen.isFullScreen(document)) {
      const fsDocElem = <FsDocumentElement> document.documentElement;
  
      if (fsDocElem.requestFullscreen)
        fsDocElem.requestFullscreen();
      else if (fsDocElem.msRequestFullscreen)
        fsDocElem.msRequestFullscreen();
      else if (fsDocElem.mozRequestFullScreen)
        fsDocElem.mozRequestFullScreen();
      else if (fsDocElem.webkitRequestFullscreen)
        fsDocElem.webkitRequestFullscreen();
    }
    else if (fsDoc.exitFullscreen)
      fsDoc.exitFullscreen();
    else if (fsDoc.msExitFullscreen)
      fsDoc.msExitFullscreen();
    else if (fsDoc.mozCancelFullScreen)
      fsDoc.mozCancelFullScreen();
    else if (fsDoc.webkitExitFullscreen)
      fsDoc.webkitExitFullscreen();
  }
  
  public static setFullScreen(document:Document,full: boolean): void {
    if (full !== BrowserFullScreen.isFullScreen(document))
    BrowserFullScreen.toggleFullScreen(document);
  }
/*
// View in fullscreen 
public static openFullscreen():void {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { // Firefox 
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { // Chrome, Safari and Opera 
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE/Edge 
      elem.msRequestFullscreen();
    }
  }
  
  // Close fullscreen 
  public static closeFullscreen(document:Document):void {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { // Firefox 
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera 
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { // IE/Edge 
      document.msExitFullscreen();
    }
  }
  */
}
