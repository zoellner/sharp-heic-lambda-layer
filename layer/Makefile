# Library Versions
WEBP_VERSION=1.4.0
LIBDE265_VERSION=1.0.15
LIBAOM_VERSION=3.9.0
X265_VERSION=3.6
LIBHEIF_VERSION=1.17.6
VIPS_VERSION=8.15.2
SHARP_VERSION=0.33.3

PREFIX_PATH=/usr/local
LIB_PATH=$(PREFIX_PATH)/lib
LIBRARY_PATH=$(LIB_PATH)
# EXAMPLE_IMAGE_PATH=$(CURDIR)/example-images

export PKG_CONFIG_PATH=$(LIB_PATH)/pkgconfig:$$PKG_CONFIG_PATH
export LD_LIBRARY_PATH=$(LIB_PATH):$$LD_LIBRARY_PATH

build-SharpHEICLayer: libvips
	mkdir -p "$(ARTIFACTS_DIR)/nodejs"
	mkdir -p "$(ARTIFACTS_DIR)/lib"

	# sharp uses several of the libs we installed or compiled. extract the full list and copy all of those into $(ARTIFACTS_DIR)/lib
	# extract list with ldd from sharp.node, manipulate a bit to only get the absolute paths, then copy

	# install
	npm install --save --prefix "$(ARTIFACTS_DIR)/nodejs/" node-addon-api node-gyp
	npm install --build-from-source --prefix "$(ARTIFACTS_DIR)/nodejs/" --verbose --foreground-scripts --platform=linux --arch=x64 sharp@$(SHARP_VERSION)

	# debug logs
	# ls -la $(ARTIFACTS_DIR)/nodejs/node_modules/sharp/src/build/*/

	# copy the shared objects
	ldd $(ARTIFACTS_DIR)/nodejs/node_modules/sharp/src/build/Release/sharp-linux-x64.node | awk '{ print $$3 }' | grep '/' | xargs -I '{}' cp '{}' $(ARTIFACTS_DIR)/lib

	# debug logs
	# ls -la $(ARTIFACTS_DIR)/lib/

libwebp:
	# libwebp
	curl -L https://github.com/webmproject/libwebp/archive/v$(WEBP_VERSION).tar.gz | tar zx
	cd libwebp-$(WEBP_VERSION) && ./autogen.sh && ./configure --enable-libwebpmux --prefix=$(PREFIX_PATH) && make V=0 && make install

libde265:
	# libde265
	curl -L https://github.com/strukturag/libde265/releases/download/v$(LIBDE265_VERSION)/libde265-$(LIBDE265_VERSION).tar.gz | tar zx
	cd libde265-$(LIBDE265_VERSION) && ./autogen.sh && ./configure --disable-dec265 --disable-sherlock265 --prefix=$(PREFIX_PATH) && make V=0 && make install

x265:
	# x265
	curl -L https://bitbucket.org/multicoreware/x265_git/downloads/x265_$(X265_VERSION).tar.gz | tar zx
	cd x265_$(X265_VERSION) && cd build/linux && cmake -G "Unix Makefiles" -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=$(PREFIX_PATH) ../../source && make && make install

# libaom:
# 	# libaom
# 	curl -L https://storage.googleapis.com/aom-releases/libaom-${LIBAOM_VERSION}.tar.gz | tar zx
# 	cd libaom-${LIBAOM_VERSION} && cd build && cmake -DCONFIG_AV1_ENCODER=0 -DBUILD_SHARED_LIBS=1 -DENABLE_TESTS=0 -DENABLE_DOCS=0 -DCMAKE_INSTALL_PREFIX=${PREFIX_PATH} -DCMAKE_INSTALL_LIBDIR=${LIB_PATH}/lib .. && make V=0 && make install

libheif: x265 libde265
	# libheif
	curl -L https://github.com/strukturag/libheif/releases/download/v$(LIBHEIF_VERSION)/libheif-$(LIBHEIF_VERSION).tar.gz | tar zx
	cd libheif-$(LIBHEIF_VERSION) && mkdir build && cd build && cmake -DCMAKE_INSTALL_LIBDIR=$(LIB_PATH) --preset=release-noplugins .. && make V=0 && make install

libvips: installLib libheif libwebp
	# libvips
	curl -L https://github.com/libvips/libvips/releases/download/v$(VIPS_VERSION)/vips-$(VIPS_VERSION).tar.xz | tar xJ
	cd vips-$(VIPS_VERSION) && meson setup build --prefix ${PREFIX_PATH} --libdir ${LIB_PATH} -Dheif=enabled -Dheif-module=disabled -Dlcms=enabled --buildtype release && cd build && meson compile && meson install

# libheif: libde265
# 	# libheif
# 	curl -L https://github.com/strukturag/libheif/releases/download/v$(LIBHEIF_VERSION)/libheif-$(LIBHEIF_VERSION).tar.gz | tar zx
# 	cd libheif-$(LIBHEIF_VERSION) && ./autogen.sh && ./configure --prefix=$(PREFIX_PATH) && make V=0 && make install
# 	cd libheif-$(LIBHEIF_VERSION)/examples && ./heif-convert example.heic example.jpeg && cp example*.jpeg $(EXAMPLE_IMAGE_PATH) && cp example.heic $(EXAMPLE_IMAGE_PATH)

# libvips: installLib libheif libwebp
# 	# libvips
# 	curl -L https://github.com/libvips/libvips/releases/download/v$(VIPS_VERSION)/vips-$(VIPS_VERSION).tar.gz | tar zx
# 	cd vips-$(VIPS_VERSION) && ./configure --prefix=$(PREFIX_PATH) && make V=0 && make install
# 	cd vips-$(VIPS_VERSION)/tools && ./vips rot $(EXAMPLE_IMAGE_PATH)/example.heic $(EXAMPLE_IMAGE_PATH)/example-rot.jpeg d90

installLib:
	dnf groupinstall -y "Development Tools" && \
	dnf install -y \
		glib2-devel \
		expat-devel \
		libjpeg-turbo-devel \
		libpng-devel \
		giflib-devel \
		libexif-devel \
		librsvg2-devel \
		libtiff-devel \
		lcms2-devel \
		gobject-introspection-devel \
		cmake \
		nasm \
		pkg-config \
		meson \
		ninja-build

