import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  DeviceEventEmitter,
  Pressable,
} from 'react-native';
import DataWedgeIntents from 'react-native-datawedge-intents';

const App = () => {
  const initialState = {
    SCANNER_FIRMWARE: ['...'],
    DECODER_LIBRARY: 'wait result...',
    BARCODE_SCANNING: 'wait result...',
  };
  const [barcodeResponse, setBarcodeResponse] = useState('Scan your code!!!');
  const [dataWedgeVersion, setDataWedgeVersion] = useState('wait result...');
  const [setActiveProfile, setSetActiveProfile] = useState('wait result...');
  const [info, setInfo] = useState(initialState);

  const setBarcode = (res: string) => {
    setBarcodeResponse(res);
  };

  const setDataWedge = (res: string) => {
    setDataWedgeVersion(res);
  };
  const setInfoState = (props: any) => {
    setInfo(props);
  };

  const broadcastReceiverHandler = (intent: any) => {
    broadcastReceiver(intent);
  };
  DeviceEventEmitter.addListener(
    'datawedge_broadcast_intent',
    broadcastReceiverHandler,
  );

  const registerBroadcastReceiver = () => {
    console.log('registerBroadcastReceiver :>> ', 'registerBroadcastReceiver');
    DataWedgeIntents.registerBroadcastReceiver({
      filterActions: [
        'com.zebra.reactnativedemo.ACTION',
        'com.symbol.datawedge.api.RESULT_ACTION',
      ],
      filterCategories: ['android.intent.category.DEFAULT'],
    });
  };

  const determineVersion = () => {
    sendCommand('com.symbol.datawedge.api.GET_VERSION_INFO', '');
  };
  const getRESULT_ACTION = () => {
    sendCommand('com.symbol.datawedge.api.RESULT_ACTION', '');
  };

  const broadcastReceiver = (intent: any) => {
    console.log('Received Intent: ' + JSON.stringify(intent));
    if (intent.hasOwnProperty('RESULT_INFO')) {
      var commandResult =
        intent.RESULT +
        ' (' +
        intent.COMMAND.substring(
          intent.COMMAND.lastIndexOf('.') + 1,
          intent.COMMAND.length,
        ) +
        ')';
      commandReceived(commandResult.toLowerCase());
    }

    if (
      intent.hasOwnProperty('com.symbol.datawedge.api.RESULT_GET_VERSION_INFO')
    ) {
      var versionInfo =
        intent['com.symbol.datawedge.api.RESULT_GET_VERSION_INFO'];
      console.log('Version Info: ' + JSON.stringify(versionInfo));
      var datawedgeVersion = versionInfo['DATAWEDGE'];
      console.log('Datawedge version: ' + datawedgeVersion);
      setDataWedge(datawedgeVersion);
      setInfoState(versionInfo);
    } else if (
      intent.hasOwnProperty(
        'com.symbol.datawedge.api.RESULT_ENUMERATE_SCANNERS',
      )
    ) {
      //  Return from our request to enumerate the available scanners
      var enumeratedScannersObj =
        intent['com.symbol.datawedge.api.RESULT_ENUMERATE_SCANNERS'];
      enumerateScanners(enumeratedScannersObj);
    } else if (
      intent.hasOwnProperty(
        'com.symbol.datawedge.api.RESULT_GET_ACTIVE_PROFILE',
      )
    ) {
      //  Return from our request to obtain the active profile
      var activeProfileObj =
        intent['com.symbol.datawedge.api.RESULT_GET_ACTIVE_PROFILE'];
      activeProfile(activeProfileObj);
    } else if (
      intent.hasOwnProperty(
        'com.symbol.datawedge.api.RESULT_GET_ACTIVE_PROFILE',
      )
    ) {
      //  Return from our request to obtain the active profile
      var resultGetActiveProfile =
        intent['com.symbol.datawedge.api.RESULT_GET_ACTIVE_PROFILE'];
      console.log('resultGetActiveProfile :>> ', resultGetActiveProfile);
    } else if (!intent.hasOwnProperty('RESULT_INFO')) {
      //  A barcode has been scanned
      barcodeScanned(intent, new Date().toLocaleString());
    }
  };

  const commandReceived = (commandText: any) => {
    console.log('commandText :>> ', commandText);
    // state.lastApiText = commandText;
    // setState(state);
  };

  const sendCommand = (extraName: any, extraValue: any) => {
    console.log(
      'Sending Command: ' + extraName + ', ' + JSON.stringify(extraValue),
    );
    let broadcastExtras: any = {};
    broadcastExtras[extraName] = extraValue;
    broadcastExtras['SEND_RESULT'] = true;
    // broadcastExtras['COMMAND_IDENTIFIER'] = 'INTENT_API';
    console.log('broadcastExtras :>> ', broadcastExtras);
    DataWedgeIntents.sendBroadcastWithExtras({
      action: 'com.symbol.datawedge.api.ACTION',
      extras: broadcastExtras,
    });
  };

  const enumerateScanners = (enumeratedScanners: any) => {
    var humanReadableScannerList = '';
    for (var i = 0; i < enumeratedScanners.length; i++) {
      console.log(
        'Scanner found: name= ' +
          enumeratedScanners[i].SCANNER_NAME +
          ', id=' +
          enumeratedScanners[i].SCANNER_INDEX +
          ', connected=' +
          enumeratedScanners[i].SCANNER_CONNECTION_STATE,
      );
      humanReadableScannerList += enumeratedScanners[i].SCANNER_NAME;
      if (i < enumeratedScanners.length - 1) humanReadableScannerList += ', ';
    }
    // state.enumeratedScannersText = humanReadableScannerList;
  };

  const activeProfile = (theActiveProfile: any) => {
    setSetActiveProfile(theActiveProfile);
  };

  const barcodeScanned = (scanData: any, timeOfScan: any) => {
    var scannedData = scanData['com.symbol.datawedge.data_string'];
    var scannedType = scanData['com.symbol.datawedge.label_type'];
    console.log('Scan: ' + scannedData);
    setBarcode(scannedData);
  };

  const createProfile = () => {
    //  Set the new configuration
    const barcodeConfig = {
      PLUGIN_NAME: 'BARCODE',
      PARAM_LIST: {
        //"current-device-id": this.selectedScannerId,
        scanner_selection: 'auto',
        decoder_ean8: 'true',
        decoder_ean13: 'true',
        // decoder_code128: '' + state.code128checked,
        // decoder_code39: '' + state.code39checked,
      },
    };
    var profileConfig = {
      PROFILE_NAME: 'ZebraReactNativeDemo',
      PROFILE_ENABLED: 'true',
      CONFIG_MODE: 'CREATE_IF_NOT_EXIST',
      PLUGIN_CONFIG: barcodeConfig,
    };
    sendCommand('com.symbol.datawedge.api.SET_CONFIG', profileConfig);

    var profileConfig2 = {
      PROFILE_NAME: 'ZebraReactNativeDemo',
      PROFILE_ENABLED: 'true',
      CONFIG_MODE: 'UPDATE',
      PLUGIN_CONFIG: {
        PLUGIN_NAME: 'INTENT',
        RESET_CONFIG: 'true',
        PARAM_LIST: {
          intent_output_enabled: 'true',
          intent_action: 'com.zebra.reactnativedemo.ACTION',
          intent_delivery: '2',
        },
      },
    };
    sendCommand('com.symbol.datawedge.api.SET_CONFIG', profileConfig2);

    var profileConfig3 = {
      PROFILE_NAME: 'ZebraReactNativeDemo',
      PROFILE_ENABLED: 'true',
      CONFIG_MODE: 'UPDATE',
      PLUGIN_CONFIG: {
        PLUGIN_NAME: 'BARCODE',
        RESET_CONFIG: 'true',
        PARAM_LIST: {},
      },
      APP_LIST: [
        {
          PACKAGE_NAME: 'com.myapp',
          ACTIVITY_LIST: ['*'],
        },
      ],
    };
    sendCommand('com.symbol.datawedge.api.SET_CONFIG', profileConfig3);
  };
  //

  useEffect(() => {
    createProfile();
    registerBroadcastReceiver();
    determineVersion();
    getRESULT_ACTION();
  }, []);

  return (
    <View style={{alignItems: 'flex-start', flexDirection: 'column', flex: 1}}>
      <Text>Datawedge version: :{dataWedgeVersion}</Text>
      <Text>ActiveProfile :{setActiveProfile}</Text>
      <Text>SCANNER_FIRMWARE :{JSON.stringify(info.SCANNER_FIRMWARE)}</Text>
      <Text>BARCODE_SCANNING :{info.BARCODE_SCANNING}</Text>
      <Text>DECODER_LIBRARY :{info.DECODER_LIBRARY}</Text>
      <View
        style={{
          flex: 1,
          backgroundColor: '#aaf',
          width: '100%',
          justifyContent: 'center',
          alignContent: 'center',
        }}>
        <Text
          style={{
            justifyContent: 'center',
            alignContent: 'center',
            textAlign: 'center',
            color: '#FFF',
            fontSize: 30,
          }}>
          {barcodeResponse}
        </Text>
      </View>
    </View>
  );
};

export default App;

const styles = StyleSheet.create({});
