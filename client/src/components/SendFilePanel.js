import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import CopyToClipboard from 'react-copy-to-clipboard';
import prettyBytes from 'pretty-bytes';
import uuidv4 from 'uuid/v4';
import {
  Link,
} from 'react-router-dom';
import QRCode from 'qrcode.react';

import Icon from './common/Icon';
import Button from './common/Button';
import Steps from './common/Steps';
import Toast from './common/Toast';
import FileBox from './FileBox';
import { prepareSend } from '../actions/file';

import styles from './SendFilePanel.cm.styl';

const Step = Steps.Step;

class SendFilePanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      curStep: 1,
      files: [],
    };
    this.inputRef = React.createRef();
    this.onClickUpload = this.onClickUpload.bind(this);
    this.onChangeFile = this.onChangeFile.bind(this);
    this.onRemoveFile = this.onRemoveFile.bind(this);
    this.onClickSelectDone = this.onClickSelectDone.bind(this);
    this.onClickBack = this.onClickBack.bind(this);
  }

  onClickUpload() {
    this.inputRef.current.click();
  }

  onClickSelectDone() {
    this.setState({
      curStep: 2,
    });
    this.props.prepareSend(this.state.files);
  }

  onClickBack() {
    this.setState(state => {
      return {
        curStep: state.curStep - 1,
      };
    });
  }

  onChangeFile(event) {
    const files = Array.from(event.target.files);

    const filteredFiles = files.filter(f => {
      const existed = this.state.files.find(f1 => {
        if (f1.name === f.name && f1.size === f.size && f1.lastModified === f.lastModified && f1.type === f.type) {
          return true;
        }
        return false;
      });
      return !existed;
    });

    if (filteredFiles.length !== files.length) {
      Toast.info('发现疑似相同的文件，已自动过滤');
    }

    filteredFiles.forEach(f => {
      f.uid = uuidv4();
    });

    this.setState(state => {
      return {
        files: state.files.concat(filteredFiles),
      };
    });
  }

  onRemoveFile(uid) {
    return () => {
      this.setState(state => {
        return {
          files: state.files.filter(f => f.uid !== uid),
        };
      });
    };
  }

  renderStep1() {
    const {
      files,
    } = this.state;

    const totalBytes = files.reduce((sum, cur) => {
      return sum + cur.size;
    }, 0);

    if (files.length === 0) {
      return (
        <>
          <div className={styles.uploadArea}>
            <div className={styles.iconPlusWrapper}>
              <Icon name="plus" className={styles.iconPlus} />
            </div>
            <div className={styles.uploadTip}>
              将文件拖动到方框内或点击下方按钮
            </div>
            <Button
              type="primary"
              className={styles.uploadBtn}
              onClick={this.onClickUpload}
            >
              上传文件
            </Button>
          </div>
          <div className={styles.recvGuide}>
            已有收件码？点击
            <Link to="/recv" className={styles.link}> 接收文件</Link>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div className={styles.uploadArea}>
            <FileBox
              files={files}
              removable
              onRemoveFile={this.onRemoveFile}
            />
          </div>
          <div className={styles.uploadMore}>
            <div className={styles.addMore} onClick={this.onClickUpload}>
              <span>添加文件</span>
            </div>
            <div className={styles.fileSummary}>{files.length} 个文件，共 {prettyBytes(totalBytes)}</div>
          </div>
          <Button type="primary" className={styles.btnSelectFileDone} onClick={this.onClickSelectDone}>
            选好了
          </Button>
        </>
      );
    }
  }

  renderStep2() {
    const {
      recvCode,
    } = this.props;

    const recvLink = `http://${document.location.host}/r/${recvCode}`;

    return (
      <>
        <div className={styles.selectSendMethod}>
          请选择发送方式：
        </div>
        <div className={styles.sendMethod1}>
          1. 通过链接发送（对方打开链接即可下载文件）
        </div>
        <div className={styles.recvLinkContainer}>
          <span className={styles.recvLink}>
            {recvLink}
          </span>
          <CopyToClipboard text={recvLink} onCopy={() => Toast.success('复制成功')}>
            <span className={styles.btnCopy}>
              复制
            </span>
          </CopyToClipboard>
        </div>
        <div>
          2. 通过6位数取件码（对方在小鹿快传网站输入即可下载文件）
        </div>
        <div className={styles.recvCodeContainer}>
          <span className={styles.recvCode}>
            {recvCode}
          </span>
          <CopyToClipboard text={recvCode} onCopy={() => Toast.success('复制成功')}>
            <span className={styles.btnCopy}>
              复制
            </span>
          </CopyToClipboard>
        </div>
        <div>
          3. 扫描下方二维码：
        </div>
        <div className={styles.qrcodeContainer}>
          <QRCode value={recvLink} />
        </div>

        <div className={styles.connectTips}>
          温馨提示：<br />
          以上取件码在10分钟内有效，请尽快发送给对方 <br />
          对方输入取件码并确认之后会自动开始发送
        </div>
        <Button type="primary" className={styles.btnWaitConnect} disabled>
          等待连接...
        </Button>
      </>
    );
  }

  renderStep3() {
    const {
      files,
    } = this.state;

    const totalBytes = files.reduce((sum, cur) => {
      return sum + cur.size;
    }, 0);

    return (
      <>
        <div className={styles.sendingBox}>
          <FileBox files={files} />
        </div>
        <div className={styles.sendingSummary}>
          正在发送{files.length}个文件，共{prettyBytes(totalBytes)}
        </div>
        <Button type="primary" className={styles.btnSending} disabled>
          正在发送...（3.5MB/s）
        </Button>
      </>
    );
  }

  render() {
    const {
      curStep,
    } = this.state;

    return (
      <div className={styles.base}>
        <div className={styles.titleRow}>
          {curStep === 2 && (
            <div className={styles.back} onClick={this.onClickBack}>
              返回
            </div>
          )}
          <div className={styles.title}>
            发送文件
          </div>
        </div>
        <Steps>
          <Step
            index={1}
            title="选择文件"
            active={curStep === 1}
          />
          <Step index={2} title="收件码" active={curStep === 2} />
          <Step index={3} title="发送" active={curStep === 3} />
        </Steps>
        {curStep === 1 && this.renderStep1()}
        {curStep === 2 && this.renderStep2()}
        {curStep === 3 && this.renderStep3()}
        <input type="file" hidden ref={this.inputRef} onChange={this.onChangeFile} multiple />
      </div>
    );
  }
}

SendFilePanel.propTypes = {
  prepareSend: PropTypes.func,
  recvCode: PropTypes.string,
};

function mapStateToProps(state) {
  return {
    recvCode: state.sendFile.recvCode,
  };
}

export default connect(mapStateToProps, {
  prepareSend,
})(SendFilePanel);
