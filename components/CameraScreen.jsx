import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Button, Text, Image } from 'react-native';
import { Camera } from 'expo-camera';
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import * as jpeg from 'jpeg-js';
import { Asset } from 'expo-asset';

const modelJson = require('../json_model/model.json');
// const modelWeights = require('../json_model/json_model/group1-shard1of29.bin');
const modelWeights = Array.from({ length: 29 }, (_, i) =>
  Asset.fromModule(require(`../json_model/group1-shard${i + 1}of29.bin`))
);

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [camera, setCamera] = useState(null);
  const [image, setImage] = useState(null);
  const [model, setModel] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        await tf.ready();
        const assets = await Promise.all(modelWeights.map(asset => asset.downloadAsync()));
        const model = await tf.loadLayersModel(bundleResourceIO(modelJson, assets.map(a => a.uri)));
        
        // const model = await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeights));
        setModel(model);
      } catch (error) {
        console.error("Failed to load model", error);
      }
    })();
  }, []);
  
  
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePictureAndDetectNails = async () => {
    if (camera) {
      const picture = await camera.takePictureAsync({ quality: 0.5, base64: true });
      detectNails(picture.base64);
    }
  };
  
  const detectNails = async (base64) => {
    const imageTensor = imageToTensor(base64);
    const prediction = await model.predict(imageTensor);
    processPrediction(prediction);
  };
  
  const takePicture = async () => {
    if (camera) {
      const data = await camera.takePictureAsync(null);
      setImage(data.uri);
    }
  };
  const imageToTensor = (rawImageData) => {
    const TO_UINT8ARRAY = true;
    const { width, height, data } = jpeg.decode(rawImageData, TO_UINT8ARRAY);
    const buffer = new Uint8Array(width * height * 3);
    let offset = 0;
    for (let i = 0; i < buffer.length; i += 3) {
      buffer[i] = data[offset];
      buffer[i + 1] = data[offset + 1];
      buffer[i + 2] = data[offset + 2];
      offset += 4;
    }
    return tf.tensor3d(buffer, [height, width, 3]);
  };
  
  const processPrediction = (prediction) => {
    console.log('Predictions:', prediction);
    // Here you can add code to visualize the predictions, e.g., drawing overlays
  };
  
  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }
  if (!model) {
    return (
      <View style={styles.container}>
        <Text>Loading model, please wait...</Text>
      </View>
    );
  }
  return (
    
        <View style={styles.container}>
        <Camera style={styles.camera} ref={setCamera} type={Camera.Constants.Type.back}>
          <View style={styles.buttonContainer}>
            <Button title="Take Picture & Detect Nails" onPress={takePictureAndDetectNails} />
          </View>
        </Camera>
        {image && <Image source={{ uri: image }} style={styles.preview} />}
      </View>
  
  
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    margin: 20,
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});
