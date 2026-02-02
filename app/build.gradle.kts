import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.tasks.KotlinJvmCompile

plugins {
	alias(libs.plugins.android.application)
	alias(libs.plugins.kotlin.android)
}

android {
	namespace = "com.minimalist.gallery"
	compileSdk = 36

	defaultConfig {
		applicationId = "com.minimalist.gallery2"
		minSdk = 27
		targetSdk = 36
		versionCode = 35
		versionName = "2.1"
	}

	compileOptions {
		sourceCompatibility(JavaVersion.VERSION_21)
		targetCompatibility(JavaVersion.VERSION_21)
	}

	tasks.withType<KotlinJvmCompile>().configureEach {
		compilerOptions {
			jvmTarget.set(JvmTarget.JVM_21)
			freeCompilerArgs.add("-opt-in=kotlin.RequiresOptIn")
		}
	}

	kotlin {
		jvmToolchain(21)
	}

	bundle {
		storeArchive {
			enable = false
		}
	}

	buildFeatures {
		buildConfig = true
	}

	buildTypes {
		debug {
			isMinifyEnabled = false
			isDebuggable = true
			applicationIdSuffix = ".debug"
		}
		release {
			isMinifyEnabled = true
			proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")

			ndk {
                debugSymbolLevel = "SYMBOL_TABLE"
            }
		}
	}
}

dependencies {
	implementation(libs.androidx.core.ktx)
	implementation(libs.androidx.appcompat)
}