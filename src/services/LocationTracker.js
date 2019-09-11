import React, { Component } from 'react';
import { Button,PermissionsAndroid,Platform,StyleSheet,Text,ToastAndroid,View} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import styles from '../styles/style.js';
import Interests from '../components/Interests.js';

export default class LocationTracker extends Component<{}> {
  watchId = null;

  state = {
    loading: false,
    updatesEnabled: false,
    location: {}
  };

  hasLocationPermission = async () => {
    if (Platform.OS === 'ios' ||
        (Platform.OS === 'android' && Platform.Version < 23)) {
      return true;
    }

    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    if (hasPermission) return true;

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    if (status === PermissionsAndroid.RESULTS.GRANTED) return true;

    if (status === PermissionsAndroid.RESULTS.DENIED) {
      ToastAndroid.show('Location permission denied by user.', ToastAndroid.LONG);
    } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      ToastAndroid.show('Location permission revoked by user.', ToastAndroid.LONG);
    }

    return false;
  }


  getLocation = async () => {
    const hasLocationPermission = await this.hasLocationPermission();

    if (!hasLocationPermission) return;

    this.setState({ loading: true }, () => {
      Geolocation.getCurrentPosition(
        (position) => {
          this.setState({ location: position, loading: false });
          console.log(position);
        },
        (error) => {
          this.setState({ location: error, loading: false });
          console.log(error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000, distanceFilter: 50, forceRequestLocation: true }
      );
    });
  }

  getLocationUpdates = async () => {
    const hasLocationPermission = await this.hasLocationPermission();
    if (!hasLocationPermission) return;
    this.setState({ updatesEnabled: true }, () => {
      this.watchId = Geolocation.watchPosition(
        (position) => {
          this.setState({ location: position });
          console.log("current position ",this.state.location);
          console.log("Hi");
          console.log("watchid ", this.watchId);

        },
        (error) => {
          this.setState({ location: error });
          console.log(error);
        },
        { enableHighAccuracy: true, distanceFilter: 0, interval: 15000, fastestInterval: 15000 }
      );
    });
  }

  removeLocationUpdates = () => {
      if (this.watchId !== null) {
          Geolocation.clearWatch(this.watchId);
          Geolocation.stopObserving();
          this.setState({ updatesEnabled: false })
          console.log("cleared");
      }
  }

  handlePress = async () => {
    console.log("in fetch call")
    fetch('http://192.168.43.102:8080/location',{
           method: 'POST',
           headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              },
           body: JSON.stringify({
             "userId": "123",
             "latitude":this.state.location.coords.latitude,
             "longitude":this.state.location.coords.longitude,
             "gpsAccuracy":this.state.location.coords.accuracy,
             "deviceId":"23ADEVIEW"
              })
          }).then(response => {
                  console.log("response from server ",response)
              })
              .catch(error =>{
                  console.log("response failed to server",error)
              })
     }


  componentWillUpdate(newProps,newState){
   console.log("called before the render method");
   console.log("NewProps: ",newProps);
   console.log("NewState: ",newState);
  }

  componentWillUnmount(){
     this.removeLocationUpdates();
    }

  render() {
    const { loading, location, updatesEnabled } = this.state;
     return (
      <View style={styles.container}>
        <View style={styles.buttons}>
            <Button title='Allow Location Tracking' onPress={this.getLocationUpdates} />
            <Button title='Goto Preferences'  onPress={() => this.props.navigation.navigate('Interests')} />
        </View>
      </View>
    );
  }


  componentDidUpdate(prevProps, prevState){
     console.log("i was caledde");
     if (
       prevState.location !== this.state.location
       ) {
          console.log("location changed");
          this.handlePress();
     }
   }
}

