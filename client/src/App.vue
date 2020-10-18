<template>
  <div>
    <!-- nav bar -->
    <Header v-bind:views="views"></Header>
    <!-- page content -->
    <router-view />
  </div>
</template>

<script>
import Header from "@/components/Header";

export default {
  name: "App",
  components: {
    Header,
  },
  data() {
    return {
      views: [
        {
          id: 1,
          name: "Home",
          route: "/",
        },
        {
          id: 2,
          name: "Board the Wiki-Train",
          route: "/game",
        },
        {
          id: 3,
          name: "About",
          route: "/about",
        },
      ],
    };
  }
};
</script>

<style lang="scss">
// import global styles
@import "./assets/custom.scss";
</style>
