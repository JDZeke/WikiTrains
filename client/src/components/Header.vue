<template>
  <div>
    <b-navbar type="dark" variant="dark">
      <b-navbar-nav>
        <div v-bind:key="view.id" v-for="view in views">
          <b-nav-item v-bind:to="view.route">{{view.name}}</b-nav-item>
        </div>
      </b-navbar-nav>
    </b-navbar>
  </div>
</template>

<script>
export default {
  name: "Header",
  props: {
    views: { type: Array }
  }
};
</script>

<style scoped>
</style>