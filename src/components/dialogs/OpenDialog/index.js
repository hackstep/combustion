import React, { Component} from 'react';
import CSSModules from 'react-css-modules';
import { inject, observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { size } from 'util/formatters';

import Dialog from 'react-toolbox/lib/dialog'
import Checkbox from 'react-toolbox/lib/checkbox';
import Input from 'react-toolbox/lib/input';

import TorrentUpload from 'stores/torrent-upload';
import Autocomplete from 'react-toolbox/lib/autocomplete';
import styles from './styles/index.css';

@inject('view_store', 'torrents_store', 'session_store')
@observer
@CSSModules(styles)
class OpenDialog extends Component {
  downloadDirs = ['/tmp/'];
  constructor(props) {
    super(props);

    this.state = {
      shouldStart: true,
      downloadDirSelected: this.props.session_store.settings['download-dir'] != null ? this.props.session_store.settings['download-dir'] : this.downloadDirs[0]
    }

    this.torrentUpload = new TorrentUpload();
    this.torrentUpload.setDownloadDir(this.state.downloadDirSelected);
    this.props.session_store.getFreeSpace(this.state.downloadDirSelected);
  }

  @autobind onUpload(event) {
    event.preventDefault();
    this.torrentUpload.serialize().then((torrents) => {
      torrents.forEach((torrentData) => this.props.torrents_store.add(torrentData));
    });
    this.props.view_store.toggleOpenDialog();
  }

  @autobind onCancel(event) {
    event.preventDefault();
    this.props.view_store.toggleOpenDialog();
  }

  @autobind onHide() {
    this.props.view_store.toggleOpenDialog();
  }

  @autobind onChangeFiles({ target }) {
    this.torrentUpload.setTorrentFiles(target.files);
  }

  @autobind onChangeUrl(value) {
    this.torrentUpload.setTorrentUrl(value);
  }

  @autobind onChangeDownloadDirectory(value) {
    this.setState({downloadDirSelected: value});
    this.torrentUpload.setDownloadDir(value);
  }

  @autobind onBlurDownloadDirectory({ target }) {
    this.onChangeDownloadDirectory(target.value);
    this.props.session_store.getFreeSpace(target.value);
  }

  @autobind onChangeStart() {
    this.setState({ shouldStart: !this.state.shouldStart })
    this.torrentUpload.setPaused(this.state.shouldStart);
  }

  renderFreeSpace() {
    const freeSpace = this.props.session_store.freeSpace;

    if (freeSpace < 0) {
      return '';
    }

    return `(${ size(freeSpace) } Free)`;
  }

  render() {
    const actions = [
      { label: 'Cancel', onClick: this.onCancel },
      { label: 'Upload', onClick: this.onUpload }
    ]

    return (
      <Dialog
        actions={actions}
        active={this.props.view_store.isOpenDialogShown}
        onEscKeyDown={this.onHide}
        onOverlayClick={this.onHide}
        title='Upload Torrent Files'
      >
        <div styleName='body'>
          <div styleName='form'>
            <form onChange={this.onChange}>
              <section>
                <fieldset>
                  <label>Please select a torrent file to upload:</label>
                  <input name="files" type="file" multiple="multiple" onChange={this.onChangeFiles} />
                </fieldset>

                <fieldset>
                  <Input label='Magnet Link' name="filename" type="url" onChange={this.onChangeUrl} />
                </fieldset>

                <fieldset>
                  <Autocomplete
                    direction="down"
                    label={`Destination folder ${this.renderFreeSpace()}`}
                    hint="Choose folder or type..."
                    multiple={false}
                    onChange={this.onChangeDownloadDirectory}
                    onBlur={this.onBlurDownloadDirectory}
                    value={this.state.downloadDirSelected}
                    source={this.downloadDirs}
                  />
                </fieldset>

                <fieldset>
                  <label styleName='inlineCheck'>
                    <Checkbox
                      name="paused"
                      checked={this.state.shouldStart}
                      label="Start when added"
                      onChange={this.onChangeStart}
                    />
                  </label>
                </fieldset>
              </section>
            </form>
          </div>
        </div>

      </Dialog>
    );
  }
}

export default OpenDialog;
