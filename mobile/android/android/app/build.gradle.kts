plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.neffpaving.neff_service"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = "com.neffpaving.app"
        // flutter_secure_storage and google_sign_in (Credential Manager) need API 24+.
        minSdk = 24
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    // One app per company. Each flavor pairs with a Dart entrypoint:
    //   flutter run --flavor neff      -t lib/main_neff.dart
    //   flutter run --flavor muskingum -t lib/main_muskingum.dart
    //   flutter run --flavor austin    -t lib/main_austin.dart
    flavorDimensions += "company"
    productFlavors {
        create("neff") {
            dimension = "company"
            applicationId = "com.neffpaving.app"
            resValue("string", "app_name", "Neff Paving")
            resValue("color", "brand_color", "#FFF5A400")
        }
        create("muskingum") {
            dimension = "company"
            applicationId = "com.muskingummaterials.app"
            resValue("string", "app_name", "Muskingum Materials")
            resValue("color", "brand_color", "#FF4E6B3A")
        }
        create("austin") {
            dimension = "company"
            applicationId = "com.austintrucking.app"
            resValue("string", "app_name", "Austin Trucking")
            resValue("color", "brand_color", "#FF9B1B1B")
        }
    }

    buildTypes {
        release {
            // Replace with a real upload key before publishing to Google Play.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
