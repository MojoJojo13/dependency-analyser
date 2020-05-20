class SecondFileStuff {
    nmbRegexp = /^[0-9]+$/;
    isAcceptable(s) {
        return s.length === 5 && this.nmbRegexp.test(s);
    }
}

export {SecondFileStuff}